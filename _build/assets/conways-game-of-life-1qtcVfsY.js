import{h as D,j as c,b as m,S as _,t as s}from"./web-pVQ_mhaE.js";class d{static CODE={WEBGPU:{ERROR_CODE:1,TEXT:"The browser in used does not support WebGPU. May I suggest using Chrome 113 and above. Thank you."},EINSTANTIATE:{ERROR_CODE:2,TEXT:"Should/Cannot instantiate a static class"}};constructor(){throw new Error(function(){return d.DISPLAY_ERROR(d.CODE.EINSTANTIATE)}())}static DISPLAY_ERROR(t){let e="";return Object.entries(t).map(([a,l],u)=>{u>0?e+=`${l}`:e+=`${a} ${l} - `}),e}}var M=s('<div class="m-4 w-[80%]">'),$=s('<button class="sm:wh-26 md:wh-32 lg:wh-32 m-2 box-border h-32 w-32 bg-blue-900 hover:bg-blue-400 sm:text-base md:text-base lg:text-base text-white font-bold py-2 px-6 rounded-full">Click Me to refresh simulation'),F=s('<div class="flex-auto flex-col v-56 gap-4 justify-items-center">'),V=s("<div>");class q{_canvas;context;_pElem;_webGpuSupported;GRID_SIZE=32;currentAnimationFrameID;cellStateArray;device;cellStateStorage;constructor(){let t=document.createElement("canvas");t.id="ConwayGameOfLifeCanvas",t.classList.add("w-[100%]"),this._webGpuSupported=!0,navigator.gpu||(this._webGpuSupported=!1);let e=document.createElement("p");e.innerHTML=d.CODE.WEBGPU.TEXT,e.classList.add("text-2xl"),this._pElem=e,this._canvas=t;const a=this._canvas.getContext("webgpu");this.context=a,this.cellStateArray=new Uint32Array(this.GRID_SIZE*this.GRID_SIZE),this.currentAnimationFrameID=1,this.cellStateStorage=[],this.device=null}async Setup(){const t=window.devicePixelRatio||2;this._canvas.width=this._canvas.width*t,this._canvas.height=this._canvas.height*2.5*t;let e=0,a=this.GRID_SIZE;const l=await navigator.gpu.requestAdapter();if(!l)throw new Error("No appropriate GPUAdapter found.");this.device=await l.requestDevice();const u=new Float32Array([a,a]),f=this.device.createBuffer({label:"Grid Uniforms",size:u.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});if(this.device.queue.writeBuffer(f,0,u),this.context==null){this._webGpuSupported=!1;return}const b=navigator.gpu.getPreferredCanvasFormat();this.context.configure({device:this.device,format:b});const p=new Float32Array([-.8,-.8,.8,-.8,.8,.8,-.8,-.8,.8,.8,-.8,.8]),y=this.device.createBuffer({label:"Cell vertices",size:p.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(y,0,p);const C={arrayStride:8,attributes:[{format:"float32x2",offset:0,shaderLocation:0}]};this.cellStateStorage=[this.device.createBuffer({label:"Cell State A",size:this.cellStateArray.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.createBuffer({label:"Cell State B",size:this.cellStateArray.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})];for(let i=0;i<this.cellStateArray.length;i++)this.cellStateArray[i]=Math.random()>.6?1:0;this.device.queue.writeBuffer(this.cellStateStorage[0],0,this.cellStateArray);for(let i=0;i<this.cellStateArray.length;i++)this.cellStateArray[i]=i%2;this.device.queue.writeBuffer(this.cellStateStorage[1],0,this.cellStateArray);const x=this.device.createShaderModule({label:"Cell shader",code:`
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
            `}),h=8,O=this.device.createShaderModule({label:"Game of Life simulation shader",code:`
            
            
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
            `}),g=this.device.createBindGroupLayout({label:"Cell Bind Group Layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.COMPUTE|GPUShaderStage.FRAGMENT,buffer:{}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),G=this.device.createPipelineLayout({label:"Cell Pipeline Layout",bindGroupLayouts:[g]}),I=this.device.createComputePipeline({label:"Simulation pipeline",layout:G,compute:{module:O,entryPoint:"computeMain"}}),U=this.device.createRenderPipeline({label:"Cell pipeline",layout:G,vertex:{module:x,entryPoint:"vertexMain",buffers:[C]},fragment:{module:x,entryPoint:"fragmentMain",targets:[{format:b}]}}),P=[this.device.createBindGroup({label:"Cell renderer bind group A",layout:g,entries:[{binding:0,resource:{buffer:f}},{binding:1,resource:{buffer:this.cellStateStorage[0]}},{binding:2,resource:{buffer:this.cellStateStorage[1]}}]}),this.device.createBindGroup({label:"Cell renderer bind group B",layout:g,entries:[{binding:0,resource:{buffer:f}},{binding:1,resource:{buffer:this.cellStateStorage[1]}},{binding:2,resource:{buffer:this.cellStateStorage[0]}}]})];var A=0,B=200,T=1e3/B;let R=this.context,v=this;function w(i){if(v.currentAnimationFrameID=requestAnimationFrame(w),i-A<T)return;A=i;const S=v.device.createCommandEncoder(),o=S.beginComputePass();o.setPipeline(I),o.setBindGroup(0,P[e%2]);const E=Math.ceil(a/h);o.dispatchWorkgroups(E,E),o.end(),e++;const n=S.beginRenderPass({colorAttachments:[{view:R.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:.4,a:1},storeOp:"store"}]});n.setPipeline(U),n.setBindGroup(0,P[e%2]),n.setVertexBuffer(0,y),n.draw(p.length/2,a*a),n.end();const L=S.finish();v.device.queue.submit([L])}this.currentAnimationFrameID=requestAnimationFrame(w)}get CanvasElem(){return this._canvas}get PElem(){return this._pElem}get WebGpuSupported(){return this._webGpuSupported}get CurrentFrameID(){return this.currentAnimationFrameID}reset(){for(let t=0;t<this.cellStateArray.length;t++)this.cellStateArray[t]=Math.random()>.6?1:0;this.device.queue.writeBuffer(this.cellStateStorage[0],0,this.cellStateArray),this.device.queue.writeBuffer(this.cellStateStorage[1],0,this.cellStateArray)}}function W(){let r=new q;return r.WebGpuSupported&&r.Setup(),(()=>{var t=F();return c(t,m(_,{get when(){return r.WebGpuSupported},get fallback(){return(()=>{var e=V();return c(e,()=>r.PElem),e})()},get children(){var e=M();return c(e,()=>r.CanvasElem),e}}),null),c(t,m(_,{get when(){return r.WebGpuSupported},get children(){var e=$();return e.$$click=()=>{r.reset()},e}}),null),t})()}D(["click"]);var k=s(`<main class="text-center mx-auto text-gray-700 p-4"><h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">Conway's Game Of Life`);function X(){return(()=>{var r=k();return r.firstChild,c(r,m(W,{}),null),r})()}export{X as default};
