if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}

const canvas = document.querySelector("canvas");

// Your WebGPU code will begin here!
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
}
const device = await adapter.requestDevice();
const context = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: canvasFormat,
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
pass.end();
const commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);
// Finish the command buffer and immediately submit it.
device.queue.submit([encoder.finish()]);