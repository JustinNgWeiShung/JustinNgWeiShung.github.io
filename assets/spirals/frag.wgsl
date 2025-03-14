struct Props {
    width: f32, // the width of the canvas
    height: f32, // the canvas of the screen
    time: f32, // the number of seconds since the program started
}
@group(0) @binding(0) var<uniform> props: Props;

// data structure to input to fragment shader
struct VertexOut {
    @builtin(position) pos: vec4f,
    @location(0) color: vec4f,
    @location(1) texcoord: vec2f,
}

fn fmod(x:f32, y:f32) -> f32 {
	return sign(x) * (abs(x) - y * floor(abs(x) / y));
}


// set the colors of the area within the triangle
@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4<f32>
{
    let TAU:f32 = 3.142;
    let PI:f32 = 6.284;
    let t = props.time;

    //let r:f32 = length(4*sin(t) - fragData.texcoord);
    let r:f32 = length(TAU * (sin(t)+cos(t))*fragData.texcoord);
    let angle:f32 = atan2(fragData.texcoord.y,fragData.texcoord.x);
  
    let speed:f32 = 4;
    let rays:f32 = 1;
    let clockwise:f32 = 1;

    let thickness:f32 = 0.4;
    let tiers:f32=4;
    let stretch:f32=6.28;
    let fade = 0.1;

    let blendColor = vec3f(0,0,sin(0.5*t));
    var colorChange = vec3f();
    var alpha = 1. - smoothstep(-0.1, 0.1,fract((2.*r-(angle+PI)/TAU)*rays + clockwise* t*speed)-thickness);
    //var alpha = 1. - smoothstep(0., thickness, abs(.5 - fract((2.*r-(angle+PI)/TAU)*rays + clockwise*t*speed)));
    colorChange = mix(fragData.color.xyz, blendColor, 
                    thickness*fract((4.*r-(angle+PI)/TAU)*rays + 
					clockwise* t*speed) );

  alpha *= pow(2*(2-r), fade*4);
  //return vec4f(sin(fragData.pos.x),sin(fragData.pos.y),0,1);
  
  
  //return vec4f(fragData.color.x,fragData.color.y,fragData.color.z,alpha);
  return vec4f(colorChange,alpha);
  /*
  let red = vec4f(1, 0, 0, 1);
  let cyan = vec4f(0, 1, 1, 1);

  let grid = vec2u(fragData.pos.xy) / 8;
  let checker = (grid.x + grid.y) % 2 == 1;
  return select(red, cyan, checker);
  */
}