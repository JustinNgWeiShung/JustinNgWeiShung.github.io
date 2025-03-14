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

    return vec4f(in.color.x,in.color.y,in.color.z,0.5);
}