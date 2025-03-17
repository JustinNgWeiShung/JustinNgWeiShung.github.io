///////////////////////////////////////////////////////////////////////////////
// Common
alias material_index = u32;
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Ray

struct ray {
    orig : vec3f,
    dir : vec3f,
}

fn ray_at(r: ray, t: f32) -> vec3f {
    return r.orig + t * r.dir;
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Color

alias color = vec3f;
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Utils
fn length_squared(v: vec3f) -> f32 {
    let l = length(v);
    return l * l;
}

fn near_zero(v: vec3f) -> bool {
    const s = 1e-8;
    return length(v) < s;
}

fn random_in_unit_sphere() -> vec3f {
    for (var i = 0; i < 1000; i += 1) {
        let p = random_range_vec3f(-1, 1);
        if (length_squared(p) >= 1) {
            continue;
        }
        return p;
    }
    return vec3f(0,0,0.3);
}

fn random_unit_vector() -> vec3f {
    return normalize(random_in_unit_sphere());
}

fn random_in_hemisphere(normal: vec3f) -> vec3f {
    let in_unit_sphere = random_in_unit_sphere();
    if (dot(in_unit_sphere, normal) > 0.0) { // In the same hemisphere as the normal
        return in_unit_sphere;
    }
    else {
        return -in_unit_sphere;
    }
}

fn random_in_unit_disk() -> vec3f {
    for (var i = 0; i < 1000; i += 1) {
        let p = vec3f(random_range_f32(-1,1), random_range_f32(-1,1), 0);
        if (length_squared(p) >= 1) {
            continue;
        }
        return p;
    }
    return vec3f(0.3,0,0);
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Hittable
struct hit_record {
    p: vec3f,
    normal: vec3f,
    t: f32,
    front_face: bool,
    mat: material_index,
}

fn hit_record_set_face_normal(rec: ptr<function, hit_record>, r: ray, outward_normal: vec3f) {
    (*rec).front_face = dot(r.dir, outward_normal) < 0.0;
    if ((*rec).front_face) {
        (*rec).normal = outward_normal;
    } else {
        (*rec).normal = -outward_normal;
    }
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Material

alias material_type = u32;
const MATERIAL_LAMBERTIAN:  material_type = 0;
const MATERIAL_METAL:       material_type = 1;
const MATERIAL_DIELECTRIC:  material_type = 2;

struct lambertian_material {
    albedo: color,
}

struct metal_material {
    albedo: color,
    fuzz: f32,
}

struct dielectric_material {
    ir: f32 // index of refraction
}

struct material {
    // NOTE: ideally we'd use a discriminated union
    ty: material_type,
    lambertian: lambertian_material,
    metal: metal_material,
    dielectric: dielectric_material
}

const NUM_MATERIALS = ${numMaterials};

@group(0) @binding(${this.bindings.materials})
var<uniform> materials: array<material, NUM_MATERIALS>;


// For the input ray and hit on the input material, returns true if the ray bounces, and if so,
// stores the color contribution (attenuation) from this material and the new bounce (scatter) ray.
fn material_scatter(mat: material_index, r_in: ray, rec: hit_record, attenuation: ptr<function, color>, scattered: ptr<function, ray>) -> bool {
    let m = materials[mat];
    if (m.ty == MATERIAL_LAMBERTIAN) {
        var scatter_direction = rec.normal + random_unit_vector();

        // Catch degenerate scatter direction
        if (near_zero(scatter_direction)) {
            scatter_direction = rec.normal;
        }

        *scattered = ray(rec.p, scatter_direction);
        *attenuation = m.lambertian.albedo;
        return true;

    } else if (m.ty == MATERIAL_METAL) {
        let reflected = reflect(normalize(r_in.dir), rec.normal);
        *scattered = ray(rec.p, reflected + m.metal.fuzz * random_in_unit_sphere());
        *attenuation = m.metal.albedo;
        // Only bounce rays that reflect in the same direction as the incident normal
        return dot((*scattered).dir, rec.normal) > 0;
    
    } else if (m.ty == MATERIAL_DIELECTRIC) {
        *attenuation = color(1, 1, 1);
        let refraction_ratio = select(m.dielectric.ir, 1.0 / m.dielectric.ir, rec.front_face);

        let unit_direction = normalize(r_in.dir);
        let cos_theta = min(dot(-unit_direction, rec.normal), 1.0);
        let sin_theta = sqrt(1.0 - cos_theta * cos_theta);

        let cannot_refract = (refraction_ratio * sin_theta) > 1.0;
        var direction: vec3f;

        if (cannot_refract || reflectance(cos_theta, refraction_ratio) > random_f32()) {
            direction = reflect(unit_direction, rec.normal);
        } else {
            direction = refract(unit_direction, rec.normal, refraction_ratio);
        }

        *scattered = ray(rec.p, direction);
        return true;
    }

    return false;
}

fn reflectance(cosine: f32, ref_idx: f32) -> f32 {
    // Use Schlick's approximation for reflectance.
    var r0 = (1-ref_idx) / (1+ref_idx);
    r0 = r0*r0;
    return r0 + (1-r0)*pow((1 - cosine),5);
}

///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Sphere
struct sphere {
    center: vec3f,
    radius: f32,
    mat: material_index,
}

fn sphere_hit(sphere_index: u32, r: ray, t_min: f32, t_max: f32, rec: ptr<function, hit_record>) -> bool {
    let s = &world.spheres[sphere_index];
    let oc = r.orig - (*s).center;
    let a = length_squared(r.dir);
    let half_b = dot(oc, r.dir);
    let c = length_squared(oc) - (*s).radius*(*s).radius;
    let discriminant = half_b*half_b - a*c;

    if (discriminant < 0) {
        return false;
    }

    let sqrtd = sqrt(discriminant);

    // Find the nearest root that lies in the acceptable range.
    var root = (-half_b - sqrtd) / a;
    if (root < t_min || t_max < root) {
        root = (-half_b + sqrtd) / a;
        if (root < t_min || t_max < root) {
            return false;
        }
    }

    (*rec).t = root;
    (*rec).p = ray_at(r, (*rec).t);
    let outward_normal = ((*rec).p - (*s).center) / (*s).radius;
    hit_record_set_face_normal(rec, r, outward_normal);
    (*rec).mat = (*s).mat;

    return true;
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Hittable List
const NUM_SPHERES = ${numSpheres};
struct hittable_list {
    spheres: array<sphere, NUM_SPHERES>,
}

@group(0) @binding(${this.bindings.hittable_list})
var<uniform> world: hittable_list;

fn hittable_list_hit(r: ray, t_min: f32, t_max: f32, rec: ptr<function, hit_record>) -> bool {
    var temp_rec: hit_record;
    var hit_anything = false;
    var closest_so_far = t_max;

    //0u is unsigned int of 0 unsigned
    for (var i = 0u; i < NUM_SPHERES; i += 1u) {
        let s = &world.spheres[i];
        if (sphere_hit(i, r, t_min, closest_so_far, &temp_rec)) {
            hit_anything = true;
            closest_so_far = temp_rec.t;
            *rec = temp_rec;
        }
    }
    return hit_anything;
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Camera

struct camera_create_params {
    lookfrom: vec3f,
    lookat: vec3f,
    vup : vec3f,
    vfov: f32, // vertical field-of-view in degrees
    aspect_ratio: f32,
    aperture : f32,
    focus_dist: f32
}

struct camera {
    origin: vec3f,
    lower_left_corner: vec3f,
    horizontal: vec3f,
    vertical: vec3f,
    u : vec3f,
    v : vec3f,
    w : vec3f,
    lens_radius : f32,
}

fn camera_create(p: camera_create_params) -> camera {
    let theta = radians(p.vfov);
    let h = tan(theta/2);
    let viewport_height = 2.0 * h;
    let viewport_width = p.aspect_ratio * viewport_height;

    // Note: vup, v, and w are all in the same plane
    let w = normalize(p.lookfrom - p.lookat);
    let u = normalize(cross(p.vup, w));
    let v = cross(w, u);

    let origin = p.lookfrom;
    let horizontal = p.focus_dist * viewport_width * u;
    let vertical = p.focus_dist * viewport_height * v;
    let lower_left_corner = origin - horizontal/2 - vertical/2 - p.focus_dist * w;
    let lens_radius = p.aperture / 2;

    return camera(origin, lower_left_corner, horizontal, vertical, u, v, w, lens_radius);
}

fn camera_get_ray(cam: ptr<function, camera>, s: f32, t: f32) -> ray {
    let rd = (*cam).lens_radius * random_in_unit_disk();
    let offset = (*cam).u * rd.x + (*cam).v * rd.y;
    return ray(
        (*cam).origin + offset,
        (*cam).lower_left_corner + s * (*cam).horizontal + t * (*cam).vertical - (*cam).origin - offset
    );
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Random

// Implementation copied from https://webgpu.github.io/webgpu-samples/samples/cornell#./common.wgsl

// A psuedo random number. Initialized with init_rand(), updated with rand().
var<private> rnd : vec3u;

// Initializes the random number generator.
fn init_rand(invocation_id : vec3u, seed : vec3u) {
  const A = vec3(1741651 * 1009,
                 140893  * 1609 * 13,
                 6521    * 983  * 7 * 2);
  rnd = (invocation_id * A) ^ seed;
}

// Returns a random number between 0 and 1.
fn random_f32() -> f32 {
  const C = vec3(60493  * 9377,
                 11279  * 2539 * 23,
                 7919   * 631  * 5 * 3);

  rnd = (rnd * C) ^ (rnd.yzx >> vec3(4u));
  return f32(rnd.x ^ rnd.y) / f32(0xffffffff);
}

fn random_range_f32(min: f32, max: f32) -> f32 {
    return mix(min, max, random_f32());
}

fn random_vec3f() -> vec3f {
    return vec3(random_f32(), random_f32(), random_f32());
}

fn random_range_vec3f(min: f32, max: f32) -> vec3f {
    return vec3(random_range_f32(min, max), random_range_f32(min, max), random_range_f32(min, max));
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////y////////////////////////
// Main

@group(0) @binding(${this.bindings.output})
var<storage, read_write> output : array<u32>;

@group(0) @binding(${this.bindings.camera_create_params})
var<uniform> cp: camera_create_params;

struct raytracer_config {
    samples_per_pixel: u32,
    max_depth: u32,
    rand_seed: vec4f,
    weight: f32,
}
@group(0) @binding(${this.bindings.raytracer_config})
var<uniform> config: raytracer_config;

const infinity = 3.402823466e+38; // NOTE: largest f32 instead of inf
const pi = 3.1415926535897932385;

fn ray_color(in_r: ray, in_max_depth: u32) -> color {
    // Book uses recursion for bouncing rays. We can't recurse in WGSL, so convert algorithm to procedural.
    var r = in_r;
    var c : color = color(1,1,1);
    var rec: hit_record;
    var max_depth = in_max_depth;

    while (true) {
        if (hittable_list_hit(r, 0.001, infinity, &rec)) {
           var attenuation: color;
           var scattered: ray;
            if (material_scatter(rec.mat, r, rec, &attenuation, &scattered)) {
                c *= attenuation;
                r = scattered;
            } else {
                // Material does not contribute
                // c *= color(0,0,0);
                break;
            }

        } else {
            // If we hit nothing, return a blue sky color (linear blend of ray direction with white and blue)
            let unit_direction = normalize(r.dir);
            let t = 0.5 * (unit_direction.y + 1.0);
            c *= (1.0 - t) * color(1.0, 1.0, 1.0) + t * color(0.5, 0.7, 1.0);
            break;
        }

        // If we've exceeded the ray bounce limit, no more light is gathered.
        max_depth -= 1;
        if (max_depth <= 0) {
            // c *= color(0,0,0);
            break;
        }
    }

    return c;
}

fn color_to_u32(c: color) -> u32 {
    let r = u32(c.r * 255.0);
    let g = u32(c.g * 255.0);
    let b = u32(c.b * 255.0);
    let a = 255u;

    // bgra8unorm
    return (a << 24) | (r << 16) | (g << 8) | b;

    // rgba8unorm
    // return (a << 24) | (b << 16) | (g << 8) | r;
}

fn u32_to_color(c: u32) -> color {
    let r = f32((c >> 16) & 0xff) / 255.0;
    let g = f32((c >> 8) & 0xff) / 255.0;
    let b = f32((c >> 0) & 0xff) / 255.0;
    return color(r, g, b);
}

fn write_color(offset: u32, pixel_color: color, samples_per_pixel: u32) {
    var c = pixel_color;
    // Divide the color by the number of samples.
    c /= f32(samples_per_pixel);

    // And gamma-correct for gamma=2.0.
    c = sqrt(c);

    var last = u32_to_color(output[offset]);
    var w = config.weight;
    output[offset] = color_to_u32(last * (1-w) + c * w);
}

@compute @workgroup_size(${wgSize})
fn main(
    @builtin(global_invocation_id) global_invocation_id : vec3<u32>,
    ) {
        init_rand(global_invocation_id, vec3u(config.rand_seed.xyz * 0xffffffff));

        // Camera
        var cam = camera_create(cp);

        // Render

        // Compute current x,y
        let offset = global_invocation_id.x;
        
        // Skip if out of bounds (TODO: only invoke required number of workgroups)
        if (offset >= u32(${width * height})) {
            return;
        }

        let x = f32(offset % ${width});
        let y = ${height} - f32(offset / ${width}); // Flip Y so Y+ is up
        const image_height = ${height};
        const image_width = ${width};
        
        let samples_per_pixel = config.samples_per_pixel;
        let max_depth = config.max_depth;

        var pixel_color = color(0.0, 0.0, 0.0);
        for (var i = 0u; i < samples_per_pixel; i += 1u) {
            let u = (x + random_f32()) / (image_width - 1);
            let v = (y + random_f32()) / (image_height - 1);
            let r = camera_get_ray(&cam, u, v);
            pixel_color += ray_color(r, max_depth);
        }

        // Store color for current pixel
        write_color(offset, pixel_color, samples_per_pixel);
}
///////////////////////////////////////////////////////////////////////////////