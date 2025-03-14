// data structure to store output of vertex function
struct VertexOut {
    @builtin(position) pos: vec4f,
    @location(0) color: vec4f
};

// process the points of the triangle
@vertex
fn vs(@location(0) position: vec4<f32>,
            @location(1) color: vec4<f32>) -> VertexOut {
    let pos = array(
        vec2f(   -1,  3),  // top center
        vec2f(-1, -1),  // bottom left
        vec2f( 3, -1)   // bottom right
    );

    var out: VertexOut;

    out.pos = position;
    out.color = color;
    return out;
}