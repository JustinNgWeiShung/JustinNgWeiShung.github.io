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
fn fragment_main(fragData: VertexOut) -> @location(0) vec4<f32>
{
  let TAU:f32 = 3.142;
  let PI:f32 = 6.284;
  let t = props.time;
  let r:f32 = length(fragData.pos-0.5);
  let angle:f32 = atan2(fragData.pos.x,fragData.pos.y );
  let speed:f32 = 2;
  let rays:f32 = 6;
  let clockwise:f32 = 1;

  let thickness:f32 = 0.4;
  let tiers:f32=4;
  let stretch:f32=6.28;

  //var alpha = 1 - smoothstep(-0.1, 0.1, fract((2.0*r - (angle+3.142)/(6.284))*rays + t*speed)-thickness);
  var alpha = 1. - smoothstep(0., thickness, abs(.5 - fract((2.*r-(angle+PI)/TAU)*rays + t*speed)));

  alpha *= pow(r, 0.1*4);
  return vec4f(sin(fragData.pos.x),sin(fragData.pos.y),0,1);
  //return vec4f(fragData.color.x,fragData.color.y,fragData.color.z,alpha);
  /*
  let red = vec4f(1, 0, 0, 1);
  let cyan = vec4f(0, 1, 1, 1);

  let grid = vec2u(fragData.pos.xy) / 8;
  let checker = (grid.x + grid.y) % 2 == 1;
  return select(red, cyan, checker);
  */
}