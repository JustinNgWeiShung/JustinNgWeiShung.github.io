if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}
const GRID_SIZE = 16;

const canvas = document.querySelector("canvas");

// Your WebGPU code will begin here!
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
}
const device = await adapter.requestDevice();

// Create a uniform buffer that describes the grid.
const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
const uniformBuffer = device.createBuffer({
    label: "Grid Uniforms",
    size: uniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(uniformBuffer, 0, uniformArray);


const context = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: canvasFormat,
});
const vertices = new Float32Array([
    //   X,    Y,
    -0.8, -0.8, // Triangle 1 (Blue)
    0.8, -0.8,
    0.8,  0.8,

    -0.8, -0.8, // Triangle 2 (Red)
    0.8,  0.8,
    -0.8,  0.8,
]);
const vertexBuffer = device.createBuffer({
    label: "Cell vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);

const vertexBufferLayout = {
    arrayStride: 8,
    attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0, // Position, see vertex shader
    }],
};

const cellShaderModule = device.createShaderModule({
    label: "Cell shader",
    code: `
        struct VertexInput {
            @location(0) pos: vec2f,
            @builtin(instance_index) instance: u32,
        };

        struct VertexOutput{
            @builtin(position) pos : vec4f,
            @location(0) cell: vec2f
        };
        
        @group(0) @binding(0) var<uniform> grid: vec2f;

        @vertex
        fn vertexMain(input: VertexInput) -> VertexOutput {
            let i = f32(input.instance); // Save the instance as a float
            let cell = vec2f(i%grid.x,floor(i/grid.x));
            let cellOffset = cell/grid * 2; //compute the offset to cell
            let gridPos = (input.pos+1)/grid - 1 + cellOffset;

            var output: VertexOutput;
            output.pos = vec4f(gridPos,0,1); // (X,Y,Z,W)
            output.cell = cell;
            return output;
        }

        struct FragInput{
            @location(0) cell:vec2f
        }

        @fragment
        fn fragmentMain(input:VertexOutput) -> @location(0) vec4f {
            let c = input.cell / grid;
            return vec4f(c,1-c.y,1);//(Red, Green, Blue, Alpha)
        }
    `
});

const cellPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: "auto",
    vertex: {
        module: cellShaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout]
    },
    fragment: {
        module: cellShaderModule,
        entryPoint: "fragmentMain",
        targets: [{
            format: canvasFormat
        }]
    }
});

const bindGroup = device.createBindGroup({
    label: "Cell renderer bind group",
    layout: cellPipeline.getBindGroupLayout(0),
    entries: [{
        binding: 0,
        resource: { buffer: uniformBuffer }
    }],
});  

const encoder = device.createCommandEncoder();
const pass = encoder.beginRenderPass({
    colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: {r:0,g:0,b:0.4,a:1},
        storeOp: "store",
    }]
});

pass.setPipeline(cellPipeline);
pass.setVertexBuffer(0, vertexBuffer);

pass.setBindGroup(0,bindGroup);

pass.draw(vertices.length / 2,GRID_SIZE*GRID_SIZE); // 6 vertices

pass.end();
const commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);
// Finish the command buffer and immediately submit it.
device.queue.submit([encoder.finish()]);