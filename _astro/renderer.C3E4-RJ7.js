import{d as L,g as f,a as _,i as p,c as C,t as h,S as I,r as F}from"./web.LhFAMKic.js";class g{static CODE={WEBGPU:{ERROR_CODE:1,TEXT:"The browser in used does not support WebGPU. May I suggest using Chrome 113 and above. Thank you."},EINSTANTIATE:{ERROR_CODE:2,TEXT:"Should/Cannot instantiate a static class"}};constructor(){throw new Error(function(){return g.DISPLAY_ERROR(g.CODE.EINSTANTIATE)}())}static DISPLAY_ERROR(e){let t="";return Object.entries(e).map(([r,n],c)=>{c>0?t+=`${n}`:t+=`${r} ${n} - `}),t}}var V=h('<div class="m-4 w-[80%]">'),q=h('<button class="sm:wh-26 md:wh-32 lg:wh-32 m-2 box-border h-32 w-32 bg-blue-900 hover:bg-blue-400 sm:text-base md:text-base lg:text-base text-white font-bold py-2 px-6 rounded-full">Click Me to refresh simulation'),N=h('<div class="flex-auto flex-col v-56 gap-4 justify-items-center"><!$><!/><!$><!/>'),W=h("<div>");class k{_canvas;context;_pElem;_webGpuSupported;GRID_SIZE=32;currentAnimationFrameID;cellStateArray;device;cellStateStorage;constructor(){let e=document.createElement("canvas");e.id="ConwayGameOfLifeCanvas",e.classList.add("w-[100%]"),this._webGpuSupported=!0,navigator.gpu||(this._webGpuSupported=!1);let t=document.createElement("p");t.innerHTML=g.CODE.WEBGPU.TEXT,t.classList.add("text-2xl"),this._pElem=t,this._canvas=e;const r=this._canvas.getContext("webgpu");this.context=r,this.cellStateArray=new Uint32Array(this.GRID_SIZE*this.GRID_SIZE),this.currentAnimationFrameID=1,this.cellStateStorage=[],this.device=null}async Setup(){const e=window.devicePixelRatio||2;this._canvas.width=this._canvas.width*e,this._canvas.height=this._canvas.height*2.5*e;let t=0,r=this.GRID_SIZE;const n=await navigator.gpu.requestAdapter();if(!n)throw new Error("No appropriate GPUAdapter found.");this.device=await n.requestDevice();const c=new Float32Array([r,r]),s=this.device.createBuffer({label:"Grid Uniforms",size:c.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});if(this.device.queue.writeBuffer(s,0,c),this.context==null){this._webGpuSupported=!1;return}const o=navigator.gpu.getPreferredCanvasFormat();this.context.configure({device:this.device,format:o});const i=new Float32Array([-.8,-.8,.8,-.8,.8,.8,-.8,-.8,.8,.8,-.8,.8]),y=this.device.createBuffer({label:"Cell vertices",size:i.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(y,0,i);const U={arrayStride:8,attributes:[{format:"float32x2",offset:0,shaderLocation:0}]};this.cellStateStorage=[this.device.createBuffer({label:"Cell State A",size:this.cellStateArray.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.createBuffer({label:"Cell State B",size:this.cellStateArray.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})];for(let a=0;a<this.cellStateArray.length;a++)this.cellStateArray[a]=Math.random()>.6?1:0;this.device.queue.writeBuffer(this.cellStateStorage[0],0,this.cellStateArray);for(let a=0;a<this.cellStateArray.length;a++)this.cellStateArray[a]=a%2;this.device.queue.writeBuffer(this.cellStateStorage[1],0,this.cellStateArray);const x=this.device.createShaderModule({label:"Cell shader",code:`
                struct VertexInput {
                    @location(0) pos: vec2f,
                    @builtin(instance_index) instance: u32,
                };

                struct VertexOutput{
                    @builtin(position) pos : vec4f,
                    @location(0) cell: vec2f
                };
                
                @group(0) @binding(0) var<uniform> grid: vec2f;
                @group(0) @binding(1) var<storage> cellState: array<u32>;

                @vertex
                fn vertexMain(input: VertexInput) -> VertexOutput {
                    let i = f32(input.instance); // Save the instance as a float
                    let cell = vec2f(i%grid.x,floor(i/grid.x));
                    let state = f32(cellState[input.instance]);

                    let cellOffset = cell/grid * 2; //compute the offset to cell
                    let gridPos = (input.pos*state+1)/grid - 1 + cellOffset;

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
                    return vec4f(c,1-c.x,1);//(Red, Green, Blue, Alpha)
                }
            `}),v=8,B=this.device.createShaderModule({label:"Game of Life simulation shader",code:`
            
            
            @group(0) @binding(0) var<uniform> grid: vec2f;

            @group(0) @binding(1) var<storage> cellStateIn:array<u32>;
            @group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

            fn cellIndex(cell:vec2u) -> u32{
                return (cell.y % u32(grid.y))*u32(grid.x) + (cell.x % u32(grid.x));
            }

            fn cellActive(x:u32,y:u32) -> u32{
                return cellStateIn[cellIndex(vec2(x,y))];
            }

            @compute @workgroup_size(${v},${v})
            fn computeMain(@builtin(global_invocation_id) cell:vec3u) {
                
                let activeNeighbors = cellActive(cell.x+1, cell.y+1) +
                                cellActive(cell.x+1, cell.y) +
                                cellActive(cell.x+1, cell.y-1) +
                                cellActive(cell.x, cell.y-1) +
                                cellActive(cell.x-1, cell.y-1) +
                                cellActive(cell.x-1, cell.y) +
                                cellActive(cell.x-1, cell.y+1) +
                                cellActive(cell.x, cell.y+1);

                let i = cellIndex(cell.xy);
                switch activeNeighbors{
                    case 2:{
                        cellStateOut[i] = cellStateIn[i];
                    }
                    case 3:{
                        cellStateOut[i] = 1;
                    }
                    default:{
                        cellStateOut[i] = 0;
                    }
                    
                }
            }
            `}),S=this.device.createBindGroupLayout({label:"Cell Bind Group Layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.COMPUTE|GPUShaderStage.FRAGMENT,buffer:{}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),G=this.device.createPipelineLayout({label:"Cell Pipeline Layout",bindGroupLayouts:[S]}),O=this.device.createComputePipeline({label:"Simulation pipeline",layout:G,compute:{module:B,entryPoint:"computeMain"}}),T=this.device.createRenderPipeline({label:"Cell pipeline",layout:G,vertex:{module:x,entryPoint:"vertexMain",buffers:[U]},fragment:{module:x,entryPoint:"fragmentMain",targets:[{format:o}]}}),E=[this.device.createBindGroup({label:"Cell renderer bind group A",layout:S,entries:[{binding:0,resource:{buffer:s}},{binding:1,resource:{buffer:this.cellStateStorage[0]}},{binding:2,resource:{buffer:this.cellStateStorage[1]}}]}),this.device.createBindGroup({label:"Cell renderer bind group B",layout:S,entries:[{binding:0,resource:{buffer:s}},{binding:1,resource:{buffer:this.cellStateStorage[1]}},{binding:2,resource:{buffer:this.cellStateStorage[0]}}]})];var P=0,R=200,$=1e3/R;let D=this.context,b=this;function A(a){if(b.currentAnimationFrameID=requestAnimationFrame(A),a-P<$)return;P=a;const m=b.device.createCommandEncoder(),d=m.beginComputePass();d.setPipeline(O),d.setBindGroup(0,E[t%2]);const w=Math.ceil(r/v);d.dispatchWorkgroups(w,w),d.end(),t++;const u=m.beginRenderPass({colorAttachments:[{view:D.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:.4,a:1},storeOp:"store"}]});u.setPipeline(T),u.setBindGroup(0,E[t%2]),u.setVertexBuffer(0,y),u.draw(i.length/2,r*r),u.end();const M=m.finish();b.device.queue.submit([M])}this.currentAnimationFrameID=requestAnimationFrame(A)}get CanvasElem(){return this._canvas}get PElem(){return this._pElem}get WebGpuSupported(){return this._webGpuSupported}get CurrentFrameID(){return this.currentAnimationFrameID}reset(){for(let e=0;e<this.cellStateArray.length;e++)this.cellStateArray[e]=Math.random()>.6?1:0;this.device.queue.writeBuffer(this.cellStateStorage[0],0,this.cellStateArray),this.device.queue.writeBuffer(this.cellStateStorage[1],0,this.cellStateArray)}}function Y(){let l=new k;return l.WebGpuSupported&&l.Setup(),(()=>{var e=f(N),t=e.firstChild,[r,n]=_(t.nextSibling),c=r.nextSibling,[s,o]=_(c.nextSibling);return p(e,C(I,{get when(){return l.WebGpuSupported},get fallback(){return(()=>{var i=f(W);return p(i,()=>l.PElem),i})()},get children(){var i=f(V);return p(i,()=>l.CanvasElem),i}}),r,n),p(e,C(I,{get when(){return l.WebGpuSupported},get children(){var i=f(q);return i.$$click=()=>{l.reset()},F(),i}}),s,o),e})()}L(["click"]);export{Y as default};
