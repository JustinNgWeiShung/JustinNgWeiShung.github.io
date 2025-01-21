import{d as T,g as f,a as A,i as p,c as E,t as g,S as C,r as D}from"./web.lUs6L-QU.js";import{E as F}from"./error_codes.BXycEivx.js";var V=g('<div class="m-4 w-[80%]">'),q=g('<button class="sm:wh-26 md:wh-32 lg:wh-32 m-2 box-border h-32 w-32 bg-blue-900 hover:bg-blue-400 sm:text-base md:text-base lg:text-base text-white font-bold py-2 px-6 rounded-full">Click Me to refresh simulation'),W=g('<div class="flex-auto flex-col v-56 gap-4 justify-items-center"><!$><!/><!$><!/>'),k=g("<div>");class N{constructor(){this.GRID_SIZE=32;let e=document.createElement("canvas");e.id="ConwayGameOfLifeCanvas",e.classList.add("w-[100%]"),this._webGpuSupported=!0,navigator.gpu||(this._webGpuSupported=!1);let a=document.createElement("p");a.innerHTML=F.CODE.WEBGPU.TEXT,a.classList.add("text-2xl"),this._pElem=a,this._canvas=e;const i=this._canvas.getContext("webgpu");this.context=i,this.cellStateArray=new Uint32Array(this.GRID_SIZE*this.GRID_SIZE),this.currentAnimationFrameID=1,this.cellStateStorage=[],this.device=null}async Setup(){const e=window.devicePixelRatio||2;this._canvas.width=this._canvas.width*e,this._canvas.height=this._canvas.height*2.5*e;let a=0,i=this.GRID_SIZE;const s=await navigator.gpu.requestAdapter();if(!s)throw new Error("No appropriate GPUAdapter found.");this.device=await s.requestDevice();const u=new Float32Array([i,i]),n=this.device.createBuffer({label:"Grid Uniforms",size:u.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});if(this.device.queue.writeBuffer(n,0,u),this.context==null){this._webGpuSupported=!1;return}const o=navigator.gpu.getPreferredCanvasFormat();this.context.configure({device:this.device,format:o});const t=new Float32Array([-.8,-.8,.8,-.8,.8,.8,-.8,-.8,.8,.8,-.8,.8]),b=this.device.createBuffer({label:"Cell vertices",size:t.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(b,0,t);const B={arrayStride:8,attributes:[{format:"float32x2",offset:0,shaderLocation:0}]};this.cellStateStorage=[this.device.createBuffer({label:"Cell State A",size:this.cellStateArray.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.createBuffer({label:"Cell State B",size:this.cellStateArray.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})];for(let r=0;r<this.cellStateArray.length;r++)this.cellStateArray[r]=Math.random()>.6?1:0;this.device.queue.writeBuffer(this.cellStateStorage[0],0,this.cellStateArray);for(let r=0;r<this.cellStateArray.length;r++)this.cellStateArray[r]=r%2;this.device.queue.writeBuffer(this.cellStateStorage[1],0,this.cellStateArray);const y=this.device.createShaderModule({label:"Cell shader",code:`
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
            `}),h=8,U=this.device.createShaderModule({label:"Game of Life simulation shader",code:`
            
            
            @group(0) @binding(0) var<uniform> grid: vec2f;

            @group(0) @binding(1) var<storage> cellStateIn:array<u32>;
            @group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

            fn cellIndex(cell:vec2u) -> u32{
                return (cell.y % u32(grid.y))*u32(grid.x) + (cell.x % u32(grid.x));
            }

            fn cellActive(x:u32,y:u32) -> u32{
                return cellStateIn[cellIndex(vec2(x,y))];
            }

            @compute @workgroup_size(${h},${h})
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
            `}),v=this.device.createBindGroupLayout({label:"Cell Bind Group Layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.COMPUTE|GPUShaderStage.FRAGMENT,buffer:{}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),x=this.device.createPipelineLayout({label:"Cell Pipeline Layout",bindGroupLayouts:[v]}),O=this.device.createComputePipeline({label:"Simulation pipeline",layout:x,compute:{module:U,entryPoint:"computeMain"}}),I=this.device.createRenderPipeline({label:"Cell pipeline",layout:x,vertex:{module:y,entryPoint:"vertexMain",buffers:[B]},fragment:{module:y,entryPoint:"fragmentMain",targets:[{format:o}]}}),G=[this.device.createBindGroup({label:"Cell renderer bind group A",layout:v,entries:[{binding:0,resource:{buffer:n}},{binding:1,resource:{buffer:this.cellStateStorage[0]}},{binding:2,resource:{buffer:this.cellStateStorage[1]}}]}),this.device.createBindGroup({label:"Cell renderer bind group B",layout:v,entries:[{binding:0,resource:{buffer:n}},{binding:1,resource:{buffer:this.cellStateStorage[1]}},{binding:2,resource:{buffer:this.cellStateStorage[0]}}]})];var P=0,R=200,M=1e3/R;let $=this.context,S=this;function _(r){if(S.currentAnimationFrameID=requestAnimationFrame(_),r-P<M)return;P=r;const m=S.device.createCommandEncoder(),d=m.beginComputePass();d.setPipeline(O),d.setBindGroup(0,G[a%2]);const w=Math.ceil(i/h);d.dispatchWorkgroups(w,w),d.end(),a++;const c=m.beginRenderPass({colorAttachments:[{view:$.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:.4,a:1},storeOp:"store"}]});c.setPipeline(I),c.setBindGroup(0,G[a%2]),c.setVertexBuffer(0,b),c.draw(t.length/2,i*i),c.end();const L=m.finish();S.device.queue.submit([L])}this.currentAnimationFrameID=requestAnimationFrame(_)}get CanvasElem(){return this._canvas}get PElem(){return this._pElem}get WebGpuSupported(){return this._webGpuSupported}get CurrentFrameID(){return this.currentAnimationFrameID}reset(){for(let e=0;e<this.cellStateArray.length;e++)this.cellStateArray[e]=Math.random()>.6?1:0;this.device.queue.writeBuffer(this.cellStateStorage[0],0,this.cellStateArray),this.device.queue.writeBuffer(this.cellStateStorage[1],0,this.cellStateArray)}}function X(){let l=new N;return l.WebGpuSupported&&l.Setup(),(()=>{var e=f(W),a=e.firstChild,[i,s]=A(a.nextSibling),u=i.nextSibling,[n,o]=A(u.nextSibling);return p(e,E(C,{get when(){return l.WebGpuSupported},get fallback(){return(()=>{var t=f(k);return p(t,()=>l.PElem),t})()},get children(){var t=f(V);return p(t,()=>l.CanvasElem),t}}),i,s),p(e,E(C,{get when(){return l.WebGpuSupported},get children(){var t=f(q);return t.$$click=()=>{l.reset()},D(),t}}),n,o),e})()}T(["click"]);export{X as default};
