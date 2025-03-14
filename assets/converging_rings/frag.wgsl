struct Props {
    width: f32, // the width of the canvas
    height: f32, // the canvas of the screen
    time: f32, // the number of seconds since the program started
}
@group(0) @binding(0) var<uniform> props: Props;

// data structure to input to fragment shader
struct VertexOut {
    @builtin(position) pos: vec4f,
    @location(0) color: vec4f
};

// set the colors of the area within the triangle
@fragment
fn fs(in: VertexOut) -> @location(0) vec4f {
    let t = props.time;

    //let is const in wgsl
    //var is mutable in wgsl
    var uv = in.pos.xy / vec2f(props.width,props.height);

    uv = 2 * vec2f(uv.x, -uv.y) + vec2f(-1, 1);

    uv.x *= props.width / props.height;

    var d = distance(uv,vec2f(0));

    d = sin(d*20 - t*2) + sin(d*25 + t*4);
    d = smoothstep(0.7, 0.71, d);

    return vec4f(0,sin(t)*d,d-0.25,1);
}