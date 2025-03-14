// data structure to store output of vertex function
struct VertexOut {
    @builtin(position) pos: vec4f,
    @location(0) color: vec4f
};

// process the points of the triangle
@vertex
fn vs(
    @builtin(vertex_index) vertexIndex : u32
) -> VertexOut {
    let pos = array(
        vec2f(   -1,  3),  // top center
        vec2f(-1, -1),  // bottom left
        vec2f( 3, -1)   // bottom right
    );

    var out: VertexOut;
    out.pos = vec4f(pos[vertexIndex], 0.0, 1.0);

    return out;
}