struct VertexOut {
    @builtin(position) pos: vec4f,
    @location(0) color: vec4f
}

@vertex
fn vertex_main(@location(0) position: vec4<f32>,
            @location(1) color: vec4<f32>) -> VertexOut
{
    var output : VertexOut;
    output.pos = position;
    output.color = color;
    return output;
}