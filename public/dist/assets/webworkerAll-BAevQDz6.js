import{E as p,U as Le,T as J,M as T,m as C,d as ce,J as b,u as v,a9 as de,R as K,w as E,I as he,D as N,S as F,z as G,ag as Ye,ah as $,a5 as V,a6 as He,ai as j,a8 as L,aj as R,c as Z,B as U,t as q,x as Xe,G as Ke,a0 as Ne,$ as Y,o as fe,s as pe,ab as me,ae as ge,p as $e,q as je,ac as qe,ad as Qe,af as Je,ak as Ze,al as et,am as tt,an as H,ao as rt,ap as st,n as xe,aq as ee,ar as A,e as y,as as nt}from"./index-69SoZKyM.js";import{c as M,a as it,b as at,B as _e}from"./colorToUniform-BXaCBwVl.js";class ye{static init(e){Object.defineProperty(this,"resizeTo",{set(t){globalThis.removeEventListener("resize",this.queueResize),this._resizeTo=t,t&&(globalThis.addEventListener("resize",this.queueResize),this.resize())},get(){return this._resizeTo}}),this.queueResize=()=>{this._resizeTo&&(this._cancelResize(),this._resizeId=requestAnimationFrame(()=>this.resize()))},this._cancelResize=()=>{this._resizeId&&(cancelAnimationFrame(this._resizeId),this._resizeId=null)},this.resize=()=>{if(!this._resizeTo)return;this._cancelResize();let t,r;if(this._resizeTo===globalThis.window)t=globalThis.innerWidth,r=globalThis.innerHeight;else{const{clientWidth:s,clientHeight:n}=this._resizeTo;t=s,r=n}this.renderer.resize(t,r),this.render()},this._resizeId=null,this._resizeTo=null,this.resizeTo=e.resizeTo||null}static destroy(){globalThis.removeEventListener("resize",this.queueResize),this._cancelResize(),this._cancelResize=null,this.queueResize=null,this.resizeTo=null,this.resize=null}}ye.extension=p.Application;class be{static init(e){e=Object.assign({autoStart:!0,sharedTicker:!1},e),Object.defineProperty(this,"ticker",{set(t){this._ticker&&this._ticker.remove(this.render,this),this._ticker=t,t&&t.add(this.render,this,Le.LOW)},get(){return this._ticker}}),this.stop=()=>{this._ticker.stop()},this.start=()=>{this._ticker.start()},this._ticker=null,this.ticker=e.sharedTicker?J.shared:new J,e.autoStart&&this.start()}static destroy(){if(this._ticker){const e=this._ticker;this.ticker=null,e.destroy()}}}be.extension=p.Application;class Te{constructor(e){this._renderer=e}push(e,t,r){this._renderer.renderPipes.batch.break(r),r.add({renderPipeId:"filter",canBundle:!1,action:"pushFilter",container:t,filterEffect:e})}pop(e,t,r){this._renderer.renderPipes.batch.break(r),r.add({renderPipeId:"filter",action:"popFilter",canBundle:!1})}execute(e){e.action==="pushFilter"?this._renderer.filter.push(e):e.action==="popFilter"&&this._renderer.filter.pop()}destroy(){this._renderer=null}}Te.extension={type:[p.WebGLPipes,p.WebGPUPipes,p.CanvasPipes],name:"filter"};const te=new T;function ot(a,e){e.clear();const t=e.matrix;for(let r=0;r<a.length;r++){const s=a[r];if(s.globalDisplayStatus<7)continue;const n=s.renderGroup??s.parentRenderGroup;n!=null&&n.isCachedAsTexture?e.matrix=te.copyFrom(n.textureOffsetInverseTransform).append(s.worldTransform):n!=null&&n._parentCacheAsTextureRenderGroup?e.matrix=te.copyFrom(n._parentCacheAsTextureRenderGroup.inverseWorldTransform).append(s.groupTransform):e.matrix=s.worldTransform,e.addBounds(s.bounds)}return e.matrix=t,e}const ut=new de({attributes:{aPosition:{buffer:new Float32Array([0,0,1,0,1,1,0,1]),format:"float32x2",stride:2*4,offset:0}},indexBuffer:new Uint32Array([0,1,2,0,2,3])});class lt{constructor(){this.skip=!1,this.inputTexture=null,this.backTexture=null,this.filters=null,this.bounds=new he,this.container=null,this.blendRequired=!1,this.outputRenderSurface=null,this.globalFrame={x:0,y:0,width:0,height:0}}}class ve{constructor(e){this._filterStackIndex=0,this._filterStack=[],this._filterGlobalUniforms=new C({uInputSize:{value:new Float32Array(4),type:"vec4<f32>"},uInputPixel:{value:new Float32Array(4),type:"vec4<f32>"},uInputClamp:{value:new Float32Array(4),type:"vec4<f32>"},uOutputFrame:{value:new Float32Array(4),type:"vec4<f32>"},uGlobalFrame:{value:new Float32Array(4),type:"vec4<f32>"},uOutputTexture:{value:new Float32Array(4),type:"vec4<f32>"}}),this._globalFilterBindGroup=new ce({}),this.renderer=e}get activeBackTexture(){var e;return(e=this._activeFilterData)==null?void 0:e.backTexture}push(e){const t=this.renderer,r=e.filterEffect.filters,s=this._pushFilterData();s.skip=!1,s.filters=r,s.container=e.container,s.outputRenderSurface=t.renderTarget.renderSurface;const n=t.renderTarget.renderTarget.colorTexture.source,i=n.resolution,o=n.antialias;if(r.length===0){s.skip=!0;return}const u=s.bounds;if(this._calculateFilterArea(e,u),this._calculateFilterBounds(s,t.renderTarget.rootViewPort,o,i,1),s.skip)return;const l=this._getPreviousFilterData(),h=this._findFilterResolution(i);let c=0,d=0;l&&(c=l.bounds.minX,d=l.bounds.minY),this._calculateGlobalFrame(s,c,d,h,n.width,n.height),this._setupFilterTextures(s,u,t,l)}generateFilteredTexture({texture:e,filters:t}){const r=this._pushFilterData();this._activeFilterData=r,r.skip=!1,r.filters=t;const s=e.source,n=s.resolution,i=s.antialias;if(t.length===0)return r.skip=!0,e;const o=r.bounds;if(o.addRect(e.frame),this._calculateFilterBounds(r,o.rectangle,i,n,0),r.skip)return e;const u=n;this._calculateGlobalFrame(r,0,0,u,s.width,s.height),r.outputRenderSurface=b.getOptimalTexture(o.width,o.height,r.resolution,r.antialias),r.backTexture=v.EMPTY,r.inputTexture=e,this.renderer.renderTarget.finishRenderPass(),this._applyFiltersToTexture(r,!0);const d=r.outputRenderSurface;return d.source.alphaMode="premultiplied-alpha",d}pop(){const e=this.renderer,t=this._popFilterData();t.skip||(e.globalUniforms.pop(),e.renderTarget.finishRenderPass(),this._activeFilterData=t,this._applyFiltersToTexture(t,!1),t.blendRequired&&b.returnTexture(t.backTexture),b.returnTexture(t.inputTexture))}getBackTexture(e,t,r){const s=e.colorTexture.source._resolution,n=b.getOptimalTexture(t.width,t.height,s,!1);let i=t.minX,o=t.minY;r&&(i-=r.minX,o-=r.minY),i=Math.floor(i*s),o=Math.floor(o*s);const u=Math.ceil(t.width*s),l=Math.ceil(t.height*s);return this.renderer.renderTarget.copyToTexture(e,n,{x:i,y:o},{width:u,height:l},{x:0,y:0}),n}applyFilter(e,t,r,s){const n=this.renderer,i=this._activeFilterData,u=i.outputRenderSurface===r,l=n.renderTarget.rootRenderTarget.colorTexture.source._resolution,h=this._findFilterResolution(l);let c=0,d=0;if(u){const f=this._findPreviousFilterOffset();c=f.x,d=f.y}this._updateFilterUniforms(t,r,i,c,d,h,u,s),this._setupBindGroupsAndRender(e,t,n)}calculateSpriteMatrix(e,t){const r=this._activeFilterData,s=e.set(r.inputTexture._source.width,0,0,r.inputTexture._source.height,r.bounds.minX,r.bounds.minY),n=t.worldTransform.copyTo(T.shared),i=t.renderGroup||t.parentRenderGroup;return i&&i.cacheToLocalTransform&&n.prepend(i.cacheToLocalTransform),n.invert(),s.prepend(n),s.scale(1/t.texture.orig.width,1/t.texture.orig.height),s.translate(t.anchor.x,t.anchor.y),s}destroy(){}_setupBindGroupsAndRender(e,t,r){if(r.renderPipes.uniformBatch){const s=r.renderPipes.uniformBatch.getUboResource(this._filterGlobalUniforms);this._globalFilterBindGroup.setResource(s,0)}else this._globalFilterBindGroup.setResource(this._filterGlobalUniforms,0);this._globalFilterBindGroup.setResource(t.source,1),this._globalFilterBindGroup.setResource(t.source.style,2),e.groups[0]=this._globalFilterBindGroup,r.encoder.draw({geometry:ut,shader:e,state:e._state,topology:"triangle-list"}),r.type===K.WEBGL&&r.renderTarget.finishRenderPass()}_setupFilterTextures(e,t,r,s){if(e.backTexture=v.EMPTY,e.inputTexture=b.getOptimalTexture(t.width,t.height,e.resolution,e.antialias),e.blendRequired){r.renderTarget.finishRenderPass();const n=r.renderTarget.getRenderTarget(e.outputRenderSurface);e.backTexture=this.getBackTexture(n,t,s==null?void 0:s.bounds)}r.renderTarget.bind(e.inputTexture,!0),r.globalUniforms.push({offset:t})}_calculateGlobalFrame(e,t,r,s,n,i){const o=e.globalFrame;o.x=t*s,o.y=r*s,o.width=n*s,o.height=i*s}_updateFilterUniforms(e,t,r,s,n,i,o,u){const l=this._filterGlobalUniforms.uniforms,h=l.uOutputFrame,c=l.uInputSize,d=l.uInputPixel,f=l.uInputClamp,_=l.uGlobalFrame,x=l.uOutputTexture;o?(h[0]=r.bounds.minX-s,h[1]=r.bounds.minY-n):(h[0]=0,h[1]=0),h[2]=e.frame.width,h[3]=e.frame.height,c[0]=e.source.width,c[1]=e.source.height,c[2]=1/c[0],c[3]=1/c[1],d[0]=e.source.pixelWidth,d[1]=e.source.pixelHeight,d[2]=1/d[0],d[3]=1/d[1],f[0]=.5*d[2],f[1]=.5*d[3],f[2]=e.frame.width*c[2]-.5*d[2],f[3]=e.frame.height*c[3]-.5*d[3];const g=this.renderer.renderTarget.rootRenderTarget.colorTexture;_[0]=s*i,_[1]=n*i,_[2]=g.source.width*i,_[3]=g.source.height*i,t instanceof v&&(t.source.resource=null);const m=this.renderer.renderTarget.getRenderTarget(t);this.renderer.renderTarget.bind(t,!!u),t instanceof v?(x[0]=t.frame.width,x[1]=t.frame.height):(x[0]=m.width,x[1]=m.height),x[2]=m.isRoot?-1:1,this._filterGlobalUniforms.update()}_findFilterResolution(e){let t=this._filterStackIndex-1;for(;t>0&&this._filterStack[t].skip;)--t;return t>0&&this._filterStack[t].inputTexture?this._filterStack[t].inputTexture.source._resolution:e}_findPreviousFilterOffset(){let e=0,t=0,r=this._filterStackIndex;for(;r>0;){r--;const s=this._filterStack[r];if(!s.skip){e=s.bounds.minX,t=s.bounds.minY;break}}return{x:e,y:t}}_calculateFilterArea(e,t){if(e.renderables?ot(e.renderables,t):e.filterEffect.filterArea?(t.clear(),t.addRect(e.filterEffect.filterArea),t.applyMatrix(e.container.worldTransform)):e.container.getFastGlobalBounds(!0,t),e.container){const s=(e.container.renderGroup||e.container.parentRenderGroup).cacheToLocalTransform;s&&t.applyMatrix(s)}}_applyFiltersToTexture(e,t){const r=e.inputTexture,s=e.bounds,n=e.filters;if(this._globalFilterBindGroup.setResource(r.source.style,2),this._globalFilterBindGroup.setResource(e.backTexture.source,3),n.length===1)n[0].apply(this,r,e.outputRenderSurface,t);else{let i=e.inputTexture;const o=b.getOptimalTexture(s.width,s.height,i.source._resolution,!1);let u=o,l=0;for(l=0;l<n.length-1;++l){n[l].apply(this,i,u,!0);const c=i;i=u,u=c}n[l].apply(this,i,e.outputRenderSurface,t),b.returnTexture(o)}}_calculateFilterBounds(e,t,r,s,n){var x;const i=this.renderer,o=e.bounds,u=e.filters;let l=1/0,h=0,c=!0,d=!1,f=!1,_=!0;for(let g=0;g<u.length;g++){const m=u[g];if(l=Math.min(l,m.resolution==="inherit"?s:m.resolution),h+=m.padding,m.antialias==="off"?c=!1:m.antialias==="inherit"&&c&&(c=r),m.clipToViewport||(_=!1),!!!(m.compatibleRenderers&i.type)){f=!1;break}if(m.blendRequired&&!(((x=i.backBuffer)==null?void 0:x.useBackBuffer)??!0)){E("Blend filter requires backBuffer on WebGL renderer to be enabled. Set `useBackBuffer: true` in the renderer options."),f=!1;break}f=m.enabled||f,d||(d=m.blendRequired)}if(!f){e.skip=!0;return}if(_&&o.fitBounds(0,t.width/s,0,t.height/s),o.scale(l).ceil().scale(1/l).pad((h|0)*n),!o.isPositive){e.skip=!0;return}e.antialias=c,e.resolution=l,e.blendRequired=d}_popFilterData(){return this._filterStackIndex--,this._filterStack[this._filterStackIndex]}_getPreviousFilterData(){let e,t=this._filterStackIndex-1;for(;t>0&&(t--,e=this._filterStack[t],!!e.skip););return e}_pushFilterData(){let e=this._filterStack[this._filterStackIndex];return e||(e=this._filterStack[this._filterStackIndex]=new lt),this._filterStackIndex++,e}}ve.extension={type:[p.WebGLSystem,p.WebGPUSystem],name:"filter"};const re="http://www.w3.org/2000/svg",se="http://www.w3.org/1999/xhtml";class we{constructor(){this.svgRoot=document.createElementNS(re,"svg"),this.foreignObject=document.createElementNS(re,"foreignObject"),this.domElement=document.createElementNS(se,"div"),this.styleElement=document.createElementNS(se,"style");const{foreignObject:e,svgRoot:t,styleElement:r,domElement:s}=this;e.setAttribute("width","10000"),e.setAttribute("height","10000"),e.style.overflow="hidden",t.appendChild(e),e.appendChild(r),e.appendChild(s),this.image=N.get().createImage()}destroy(){this.svgRoot.remove(),this.foreignObject.remove(),this.styleElement.remove(),this.domElement.remove(),this.image.src="",this.image.remove(),this.svgRoot=null,this.foreignObject=null,this.styleElement=null,this.domElement=null,this.image=null,this.canvasAndContext=null}}let ne;function ct(a,e,t,r){r||(r=ne||(ne=new we));const{domElement:s,styleElement:n,svgRoot:i}=r;s.innerHTML=`<style>${e.cssStyle};</style><div style='padding:0'>${a}</div>`,s.setAttribute("style","transform-origin: top left; display: inline-block"),t&&(n.textContent=t),document.body.appendChild(i);const o=s.getBoundingClientRect();i.remove();const u=e.padding*2;return{width:o.width-u,height:o.height-u}}class dt{constructor(){this.batches=[],this.batched=!1}destroy(){this.batches.forEach(e=>{G.return(e)}),this.batches.length=0}}class Ce{constructor(e,t){this.state=F.for2d(),this.renderer=e,this._adaptor=t,this.renderer.runners.contextChange.add(this)}contextChange(){this._adaptor.contextChange(this.renderer)}validateRenderable(e){const t=e.context,r=!!e._gpuData,s=this.renderer.graphicsContext.updateGpuContext(t);return!!(s.isBatchable||r!==s.isBatchable)}addRenderable(e,t){const r=this.renderer.graphicsContext.updateGpuContext(e.context);e.didViewUpdate&&this._rebuild(e),r.isBatchable?this._addToBatcher(e,t):(this.renderer.renderPipes.batch.break(t),t.add(e))}updateRenderable(e){const r=this._getGpuDataForRenderable(e).batches;for(let s=0;s<r.length;s++){const n=r[s];n._batcher.updateElement(n)}}execute(e){if(!e.isRenderable)return;const t=this.renderer,r=e.context;if(!t.graphicsContext.getGpuContext(r).batches.length)return;const n=r.customShader||this._adaptor.shader;this.state.blendMode=e.groupBlendMode;const i=n.resources.localUniforms.uniforms;i.uTransformMatrix=e.groupTransform,i.uRound=t._roundPixels|e._roundPixels,M(e.groupColorAlpha,i.uColor,0),this._adaptor.execute(this,e)}_rebuild(e){const t=this._getGpuDataForRenderable(e),r=this.renderer.graphicsContext.updateGpuContext(e.context);t.destroy(),r.isBatchable&&this._updateBatchesForRenderable(e,t)}_addToBatcher(e,t){const r=this.renderer.renderPipes.batch,s=this._getGpuDataForRenderable(e).batches;for(let n=0;n<s.length;n++){const i=s[n];r.addToBatch(i,t)}}_getGpuDataForRenderable(e){return e._gpuData[this.renderer.uid]||this._initGpuDataForRenderable(e)}_initGpuDataForRenderable(e){const t=new dt;return e._gpuData[this.renderer.uid]=t,t}_updateBatchesForRenderable(e,t){const r=e.context,s=this.renderer.graphicsContext.getGpuContext(r),n=this.renderer._roundPixels|e._roundPixels;t.batches=s.batches.map(i=>{const o=G.get(Ye);return i.copyTo(o),o.renderable=e,o.roundPixels=n,o})}destroy(){this.renderer=null,this._adaptor.destroy(),this._adaptor=null,this.state=null}}Ce.extension={type:[p.WebGLPipes,p.WebGPUPipes,p.CanvasPipes],name:"graphics"};const Pe=class Se extends ${constructor(...e){super({});let t=e[0]??{};typeof t=="number"&&(V(He,"PlaneGeometry constructor changed please use { width, height, verticesX, verticesY } instead"),t={width:t,height:e[1],verticesX:e[2],verticesY:e[3]}),this.build(t)}build(e){e={...Se.defaultOptions,...e},this.verticesX=this.verticesX??e.verticesX,this.verticesY=this.verticesY??e.verticesY,this.width=this.width??e.width,this.height=this.height??e.height;const t=this.verticesX*this.verticesY,r=[],s=[],n=[],i=this.verticesX-1,o=this.verticesY-1,u=this.width/i,l=this.height/o;for(let c=0;c<t;c++){const d=c%this.verticesX,f=c/this.verticesX|0;r.push(d*u,f*l),s.push(d/i,f/o)}const h=i*o;for(let c=0;c<h;c++){const d=c%i,f=c/i|0,_=f*this.verticesX+d,x=f*this.verticesX+d+1,g=(f+1)*this.verticesX+d,m=(f+1)*this.verticesX+d+1;n.push(_,x,g,x,m,g)}this.buffers[0].data=new Float32Array(r),this.buffers[1].data=new Float32Array(s),this.indexBuffer.data=new Uint32Array(n),this.buffers[0].update(),this.buffers[1].update(),this.indexBuffer.update()}};Pe.defaultOptions={width:100,height:100,verticesX:10,verticesY:10};let ht=Pe;class Q{constructor(){this.batcherName="default",this.packAsQuad=!1,this.indexOffset=0,this.attributeOffset=0,this.roundPixels=0,this._batcher=null,this._batch=null,this._textureMatrixUpdateId=-1,this._uvUpdateId=-1}get blendMode(){return this.renderable.groupBlendMode}get topology(){return this._topology||this.geometry.topology}set topology(e){this._topology=e}reset(){this.renderable=null,this.texture=null,this._batcher=null,this._batch=null,this.geometry=null,this._uvUpdateId=-1,this._textureMatrixUpdateId=-1}setTexture(e){this.texture!==e&&(this.texture=e,this._textureMatrixUpdateId=-1)}get uvs(){const t=this.geometry.getBuffer("aUV"),r=t.data;let s=r;const n=this.texture.textureMatrix;return n.isSimple||(s=this._transformedUvs,(this._textureMatrixUpdateId!==n._updateID||this._uvUpdateId!==t._updateID)&&((!s||s.length<r.length)&&(s=this._transformedUvs=new Float32Array(r.length)),this._textureMatrixUpdateId=n._updateID,this._uvUpdateId=t._updateID,n.multiplyUvs(r,s))),s}get positions(){return this.geometry.positions}get indices(){return this.geometry.indices}get color(){return this.renderable.groupColorAlpha}get groupTransform(){return this.renderable.groupTransform}get attributeSize(){return this.geometry.positions.length/2}get indexSize(){return this.geometry.indices.length}}class ie{destroy(){}}class Re{constructor(e,t){this.localUniforms=new C({uTransformMatrix:{value:new T,type:"mat3x3<f32>"},uColor:{value:new Float32Array([1,1,1,1]),type:"vec4<f32>"},uRound:{value:0,type:"f32"}}),this.localUniformsBindGroup=new ce({0:this.localUniforms}),this.renderer=e,this._adaptor=t,this._adaptor.init()}validateRenderable(e){const t=this._getMeshData(e),r=t.batched,s=e.batched;if(t.batched=s,r!==s)return!0;if(s){const n=e._geometry;if(n.indices.length!==t.indexSize||n.positions.length!==t.vertexSize)return t.indexSize=n.indices.length,t.vertexSize=n.positions.length,!0;const i=this._getBatchableMesh(e);return i.texture.uid!==e._texture.uid&&(i._textureMatrixUpdateId=-1),!i._batcher.checkAndUpdateTexture(i,e._texture)}return!1}addRenderable(e,t){var n,i;const r=this.renderer.renderPipes.batch,s=this._getMeshData(e);if(e.didViewUpdate&&(s.indexSize=(n=e._geometry.indices)==null?void 0:n.length,s.vertexSize=(i=e._geometry.positions)==null?void 0:i.length),s.batched){const o=this._getBatchableMesh(e);o.setTexture(e._texture),o.geometry=e._geometry,r.addToBatch(o,t)}else r.break(t),t.add(e)}updateRenderable(e){if(e.batched){const t=this._getBatchableMesh(e);t.setTexture(e._texture),t.geometry=e._geometry,t._batcher.updateElement(t)}}execute(e){if(!e.isRenderable)return;e.state.blendMode=j(e.groupBlendMode,e.texture._source);const t=this.localUniforms;t.uniforms.uTransformMatrix=e.groupTransform,t.uniforms.uRound=this.renderer._roundPixels|e._roundPixels,t.update(),M(e.groupColorAlpha,t.uniforms.uColor,0),this._adaptor.execute(this,e)}_getMeshData(e){var t,r;return(t=e._gpuData)[r=this.renderer.uid]||(t[r]=new ie),e._gpuData[this.renderer.uid].meshData||this._initMeshData(e)}_initMeshData(e){return e._gpuData[this.renderer.uid].meshData={batched:e.batched,indexSize:0,vertexSize:0},e._gpuData[this.renderer.uid].meshData}_getBatchableMesh(e){var t,r;return(t=e._gpuData)[r=this.renderer.uid]||(t[r]=new ie),e._gpuData[this.renderer.uid].batchableMesh||this._initBatchableMesh(e)}_initBatchableMesh(e){const t=new Q;return t.renderable=e,t.setTexture(e._texture),t.transform=e.groupTransform,t.roundPixels=this.renderer._roundPixels|e._roundPixels,e._gpuData[this.renderer.uid].batchableMesh=t,t}destroy(){this.localUniforms=null,this.localUniformsBindGroup=null,this._adaptor.destroy(),this._adaptor=null,this.renderer=null}}Re.extension={type:[p.WebGLPipes,p.WebGPUPipes,p.CanvasPipes],name:"mesh"};class ft{execute(e,t){const r=e.state,s=e.renderer,n=t.shader||e.defaultShader;n.resources.uTexture=t.texture._source,n.resources.uniforms=e.localUniforms;const i=s.gl,o=e.getBuffers(t);s.shader.bind(n),s.state.set(r),s.geometry.bind(o.geometry,n.glProgram);const l=o.geometry.indexBuffer.data.BYTES_PER_ELEMENT===2?i.UNSIGNED_SHORT:i.UNSIGNED_INT;i.drawElements(i.TRIANGLES,t.particleChildren.length*6,l,0)}}class pt{execute(e,t){const r=e.renderer,s=t.shader||e.defaultShader;s.groups[0]=r.renderPipes.uniformBatch.getUniformBindGroup(e.localUniforms,!0),s.groups[1]=r.texture.getTextureBindGroup(t.texture);const n=e.state,i=e.getBuffers(t);r.encoder.draw({geometry:i.geometry,shader:t.shader||e.defaultShader,state:n,size:t.particleChildren.length*6})}}function ae(a,e=null){const t=a*6;if(t>65535?e||(e=new Uint32Array(t)):e||(e=new Uint16Array(t)),e.length!==t)throw new Error(`Out buffer length is incorrect, got ${e.length} and expected ${t}`);for(let r=0,s=0;r<t;r+=6,s+=4)e[r+0]=s+0,e[r+1]=s+1,e[r+2]=s+2,e[r+3]=s+0,e[r+4]=s+2,e[r+5]=s+3;return e}function mt(a){return{dynamicUpdate:oe(a,!0),staticUpdate:oe(a,!1)}}function oe(a,e){const t=[];t.push(`

        var index = 0;

        for (let i = 0; i < ps.length; ++i)
        {
            const p = ps[i];

            `);let r=0;for(const n in a){const i=a[n];if(e!==i.dynamic)continue;t.push(`offset = index + ${r}`),t.push(i.code);const o=L(i.format);r+=o.stride/4}t.push(`
            index += stride * 4;
        }
    `),t.unshift(`
        var stride = ${r};
    `);const s=t.join(`
`);return new Function("ps","f32v","u32v",s)}class gt{constructor(e){this._size=0,this._generateParticleUpdateCache={};const t=this._size=e.size??1e3,r=e.properties;let s=0,n=0;for(const h in r){const c=r[h],d=L(c.format);c.dynamic?n+=d.stride:s+=d.stride}this._dynamicStride=n/4,this._staticStride=s/4,this.staticAttributeBuffer=new R(t*4*s),this.dynamicAttributeBuffer=new R(t*4*n),this.indexBuffer=ae(t);const i=new de;let o=0,u=0;this._staticBuffer=new Z({data:new Float32Array(1),label:"static-particle-buffer",shrinkToFit:!1,usage:U.VERTEX|U.COPY_DST}),this._dynamicBuffer=new Z({data:new Float32Array(1),label:"dynamic-particle-buffer",shrinkToFit:!1,usage:U.VERTEX|U.COPY_DST});for(const h in r){const c=r[h],d=L(c.format);c.dynamic?(i.addAttribute(c.attributeName,{buffer:this._dynamicBuffer,stride:this._dynamicStride*4,offset:o*4,format:c.format}),o+=d.size):(i.addAttribute(c.attributeName,{buffer:this._staticBuffer,stride:this._staticStride*4,offset:u*4,format:c.format}),u+=d.size)}i.addIndex(this.indexBuffer);const l=this.getParticleUpdate(r);this._dynamicUpload=l.dynamicUpdate,this._staticUpload=l.staticUpdate,this.geometry=i}getParticleUpdate(e){const t=xt(e);return this._generateParticleUpdateCache[t]?this._generateParticleUpdateCache[t]:(this._generateParticleUpdateCache[t]=this.generateParticleUpdate(e),this._generateParticleUpdateCache[t])}generateParticleUpdate(e){return mt(e)}update(e,t){e.length>this._size&&(t=!0,this._size=Math.max(e.length,this._size*1.5|0),this.staticAttributeBuffer=new R(this._size*this._staticStride*4*4),this.dynamicAttributeBuffer=new R(this._size*this._dynamicStride*4*4),this.indexBuffer=ae(this._size),this.geometry.indexBuffer.setDataWithSize(this.indexBuffer,this.indexBuffer.byteLength,!0));const r=this.dynamicAttributeBuffer;if(this._dynamicUpload(e,r.float32View,r.uint32View),this._dynamicBuffer.setDataWithSize(this.dynamicAttributeBuffer.float32View,e.length*this._dynamicStride*4,!0),t){const s=this.staticAttributeBuffer;this._staticUpload(e,s.float32View,s.uint32View),this._staticBuffer.setDataWithSize(s.float32View,e.length*this._staticStride*4,!0)}}destroy(){this._staticBuffer.destroy(),this._dynamicBuffer.destroy(),this.geometry.destroy()}}function xt(a){const e=[];for(const t in a){const r=a[t];e.push(t,r.code,r.dynamic?"d":"s")}return e.join("_")}var _t=`varying vec2 vUV;
varying vec4 vColor;

uniform sampler2D uTexture;

void main(void){
    vec4 color = texture2D(uTexture, vUV) * vColor;
    gl_FragColor = color;
}`,yt=`attribute vec2 aVertex;
attribute vec2 aUV;
attribute vec4 aColor;

attribute vec2 aPosition;
attribute float aRotation;

uniform mat3 uTranslationMatrix;
uniform float uRound;
uniform vec2 uResolution;
uniform vec4 uColor;

varying vec2 vUV;
varying vec4 vColor;

vec2 roundPixels(vec2 position, vec2 targetSize)
{       
    return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
}

void main(void){
    float cosRotation = cos(aRotation);
    float sinRotation = sin(aRotation);
    float x = aVertex.x * cosRotation - aVertex.y * sinRotation;
    float y = aVertex.x * sinRotation + aVertex.y * cosRotation;

    vec2 v = vec2(x, y);
    v = v + aPosition;

    gl_Position = vec4((uTranslationMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);

    if(uRound == 1.0)
    {
        gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
    }

    vUV = aUV;
    vColor = vec4(aColor.rgb * aColor.a, aColor.a) * uColor;
}
`,ue=`
struct ParticleUniforms {
  uTranslationMatrix:mat3x3<f32>,
  uColor:vec4<f32>,
  uRound:f32,
  uResolution:vec2<f32>,
};

fn roundPixels(position: vec2<f32>, targetSize: vec2<f32>) -> vec2<f32>
{
  return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
}

@group(0) @binding(0) var<uniform> uniforms: ParticleUniforms;

@group(1) @binding(0) var uTexture: texture_2d<f32>;
@group(1) @binding(1) var uSampler : sampler;

struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv : vec2<f32>,
    @location(1) color : vec4<f32>,
  };
@vertex
fn mainVertex(
  @location(0) aVertex: vec2<f32>,
  @location(1) aPosition: vec2<f32>,
  @location(2) aUV: vec2<f32>,
  @location(3) aColor: vec4<f32>,
  @location(4) aRotation: f32,
) -> VSOutput {
  
   let v = vec2(
       aVertex.x * cos(aRotation) - aVertex.y * sin(aRotation),
       aVertex.x * sin(aRotation) + aVertex.y * cos(aRotation)
   ) + aPosition;

   var position = vec4((uniforms.uTranslationMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);

   if(uniforms.uRound == 1.0) {
       position = vec4(roundPixels(position.xy, uniforms.uResolution), position.zw);
   }

    let vColor = vec4(aColor.rgb * aColor.a, aColor.a) * uniforms.uColor;

  return VSOutput(
   position,
   aUV,
   vColor,
  );
}

@fragment
fn mainFragment(
  @location(0) uv: vec2<f32>,
  @location(1) color: vec4<f32>,
  @builtin(position) position: vec4<f32>,
) -> @location(0) vec4<f32> {

    var sample = textureSample(uTexture, uSampler, uv) * color;
   
    return sample;
}`;class bt extends q{constructor(){const e=Xe.from({vertex:yt,fragment:_t}),t=Ke.from({fragment:{source:ue,entryPoint:"mainFragment"},vertex:{source:ue,entryPoint:"mainVertex"}});super({glProgram:e,gpuProgram:t,resources:{uTexture:v.WHITE.source,uSampler:new Y({}),uniforms:{uTranslationMatrix:{value:new T,type:"mat3x3<f32>"},uColor:{value:new Ne(16777215),type:"vec4<f32>"},uRound:{value:1,type:"f32"},uResolution:{value:[0,0],type:"vec2<f32>"}}}})}}class Ue{constructor(e,t){this.state=F.for2d(),this.localUniforms=new C({uTranslationMatrix:{value:new T,type:"mat3x3<f32>"},uColor:{value:new Float32Array(4),type:"vec4<f32>"},uRound:{value:1,type:"f32"},uResolution:{value:[0,0],type:"vec2<f32>"}}),this.renderer=e,this.adaptor=t,this.defaultShader=new bt,this.state=F.for2d()}validateRenderable(e){return!1}addRenderable(e,t){this.renderer.renderPipes.batch.break(t),t.add(e)}getBuffers(e){return e._gpuData[this.renderer.uid]||this._initBuffer(e)}_initBuffer(e){return e._gpuData[this.renderer.uid]=new gt({size:e.particleChildren.length,properties:e._properties}),e._gpuData[this.renderer.uid]}updateRenderable(e){}execute(e){const t=e.particleChildren;if(t.length===0)return;const r=this.renderer,s=this.getBuffers(e);e.texture||(e.texture=t[0].texture);const n=this.state;s.update(t,e._childrenDirty),e._childrenDirty=!1,n.blendMode=j(e.blendMode,e.texture._source);const i=this.localUniforms.uniforms,o=i.uTranslationMatrix;e.worldTransform.copyTo(o),o.prepend(r.globalUniforms.globalUniformData.projectionMatrix),i.uResolution=r.globalUniforms.globalUniformData.resolution,i.uRound=r._roundPixels|e._roundPixels,M(e.groupColorAlpha,i.uColor,0),this.adaptor.execute(this,e)}destroy(){this.renderer=null,this.defaultShader&&(this.defaultShader.destroy(),this.defaultShader=null)}}class Be extends Ue{constructor(e){super(e,new ft)}}Be.extension={type:[p.WebGLPipes],name:"particle"};class Fe extends Ue{constructor(e){super(e,new pt)}}Fe.extension={type:[p.WebGPUPipes],name:"particle"};const Ge=class Me extends ht{constructor(e={}){e={...Me.defaultOptions,...e},super({width:e.width,height:e.height,verticesX:4,verticesY:4}),this.update(e)}update(e){var t,r;this.width=e.width??this.width,this.height=e.height??this.height,this._originalWidth=e.originalWidth??this._originalWidth,this._originalHeight=e.originalHeight??this._originalHeight,this._leftWidth=e.leftWidth??this._leftWidth,this._rightWidth=e.rightWidth??this._rightWidth,this._topHeight=e.topHeight??this._topHeight,this._bottomHeight=e.bottomHeight??this._bottomHeight,this._anchorX=(t=e.anchor)==null?void 0:t.x,this._anchorY=(r=e.anchor)==null?void 0:r.y,this.updateUvs(),this.updatePositions()}updatePositions(){const e=this.positions,{width:t,height:r,_leftWidth:s,_rightWidth:n,_topHeight:i,_bottomHeight:o,_anchorX:u,_anchorY:l}=this,h=s+n,c=t>h?1:t/h,d=i+o,f=r>d?1:r/d,_=Math.min(c,f),x=u*t,g=l*r;e[0]=e[8]=e[16]=e[24]=-x,e[2]=e[10]=e[18]=e[26]=s*_-x,e[4]=e[12]=e[20]=e[28]=t-n*_-x,e[6]=e[14]=e[22]=e[30]=t-x,e[1]=e[3]=e[5]=e[7]=-g,e[9]=e[11]=e[13]=e[15]=i*_-g,e[17]=e[19]=e[21]=e[23]=r-o*_-g,e[25]=e[27]=e[29]=e[31]=r-g,this.getBuffer("aPosition").update()}updateUvs(){const e=this.uvs;e[0]=e[8]=e[16]=e[24]=0,e[1]=e[3]=e[5]=e[7]=0,e[6]=e[14]=e[22]=e[30]=1,e[25]=e[27]=e[29]=e[31]=1;const t=1/this._originalWidth,r=1/this._originalHeight;e[2]=e[10]=e[18]=e[26]=t*this._leftWidth,e[9]=e[11]=e[13]=e[15]=r*this._topHeight,e[4]=e[12]=e[20]=e[28]=1-t*this._rightWidth,e[17]=e[19]=e[21]=e[23]=1-r*this._bottomHeight,this.getBuffer("aUV").update()}};Ge.defaultOptions={width:100,height:100,leftWidth:10,topHeight:10,rightWidth:10,bottomHeight:10,originalWidth:100,originalHeight:100};let Tt=Ge;class vt extends Q{constructor(){super(),this.geometry=new Tt}destroy(){this.geometry.destroy()}}class De{constructor(e){this._renderer=e}addRenderable(e,t){const r=this._getGpuSprite(e);e.didViewUpdate&&this._updateBatchableSprite(e,r),this._renderer.renderPipes.batch.addToBatch(r,t)}updateRenderable(e){const t=this._getGpuSprite(e);e.didViewUpdate&&this._updateBatchableSprite(e,t),t._batcher.updateElement(t)}validateRenderable(e){const t=this._getGpuSprite(e);return!t._batcher.checkAndUpdateTexture(t,e._texture)}_updateBatchableSprite(e,t){t.geometry.update(e),t.setTexture(e._texture)}_getGpuSprite(e){return e._gpuData[this._renderer.uid]||this._initGPUSprite(e)}_initGPUSprite(e){const t=e._gpuData[this._renderer.uid]=new vt,r=t;return r.renderable=e,r.transform=e.groupTransform,r.texture=e._texture,r.roundPixels=this._renderer._roundPixels|e._roundPixels,e.didViewUpdate||this._updateBatchableSprite(e,r),t}destroy(){this._renderer=null}}De.extension={type:[p.WebGLPipes,p.WebGPUPipes,p.CanvasPipes],name:"nineSliceSprite"};const wt={name:"tiling-bit",vertex:{header:`
            struct TilingUniforms {
                uMapCoord:mat3x3<f32>,
                uClampFrame:vec4<f32>,
                uClampOffset:vec2<f32>,
                uTextureTransform:mat3x3<f32>,
                uSizeAnchor:vec4<f32>
            };

            @group(2) @binding(0) var<uniform> tilingUniforms: TilingUniforms;
            @group(2) @binding(1) var uTexture: texture_2d<f32>;
            @group(2) @binding(2) var uSampler: sampler;
        `,main:`
            uv = (tilingUniforms.uTextureTransform * vec3(uv, 1.0)).xy;

            position = (position - tilingUniforms.uSizeAnchor.zw) * tilingUniforms.uSizeAnchor.xy;
        `},fragment:{header:`
            struct TilingUniforms {
                uMapCoord:mat3x3<f32>,
                uClampFrame:vec4<f32>,
                uClampOffset:vec2<f32>,
                uTextureTransform:mat3x3<f32>,
                uSizeAnchor:vec4<f32>
            };

            @group(2) @binding(0) var<uniform> tilingUniforms: TilingUniforms;
            @group(2) @binding(1) var uTexture: texture_2d<f32>;
            @group(2) @binding(2) var uSampler: sampler;
        `,main:`

            var coord = vUV + ceil(tilingUniforms.uClampOffset - vUV);
            coord = (tilingUniforms.uMapCoord * vec3(coord, 1.0)).xy;
            var unclamped = coord;
            coord = clamp(coord, tilingUniforms.uClampFrame.xy, tilingUniforms.uClampFrame.zw);

            var bias = 0.;

            if(unclamped.x == coord.x && unclamped.y == coord.y)
            {
                bias = -32.;
            }

            outColor = textureSampleBias(uTexture, uSampler, coord, bias);
        `}},Ct={name:"tiling-bit",vertex:{header:`
            uniform mat3 uTextureTransform;
            uniform vec4 uSizeAnchor;

        `,main:`
            uv = (uTextureTransform * vec3(aUV, 1.0)).xy;

            position = (position - uSizeAnchor.zw) * uSizeAnchor.xy;
        `},fragment:{header:`
            uniform sampler2D uTexture;
            uniform mat3 uMapCoord;
            uniform vec4 uClampFrame;
            uniform vec2 uClampOffset;
        `,main:`

        vec2 coord = vUV + ceil(uClampOffset - vUV);
        coord = (uMapCoord * vec3(coord, 1.0)).xy;
        vec2 unclamped = coord;
        coord = clamp(coord, uClampFrame.xy, uClampFrame.zw);

        outColor = texture(uTexture, coord, unclamped == coord ? 0.0 : -32.0);// lod-bias very negative to force lod 0

        `}};let z,k;class Pt extends q{constructor(){z??(z=fe({name:"tiling-sprite-shader",bits:[it,wt,pe]})),k??(k=me({name:"tiling-sprite-shader",bits:[at,Ct,ge]}));const e=new C({uMapCoord:{value:new T,type:"mat3x3<f32>"},uClampFrame:{value:new Float32Array([0,0,1,1]),type:"vec4<f32>"},uClampOffset:{value:new Float32Array([0,0]),type:"vec2<f32>"},uTextureTransform:{value:new T,type:"mat3x3<f32>"},uSizeAnchor:{value:new Float32Array([100,100,.5,.5]),type:"vec4<f32>"}});super({glProgram:k,gpuProgram:z,resources:{localUniforms:new C({uTransformMatrix:{value:new T,type:"mat3x3<f32>"},uColor:{value:new Float32Array([1,1,1,1]),type:"vec4<f32>"},uRound:{value:0,type:"f32"}}),tilingUniforms:e,uTexture:v.EMPTY.source,uSampler:v.EMPTY.source.style}})}updateUniforms(e,t,r,s,n,i){const o=this.resources.tilingUniforms,u=i.width,l=i.height,h=i.textureMatrix,c=o.uniforms.uTextureTransform;c.set(r.a*u/e,r.b*u/t,r.c*l/e,r.d*l/t,r.tx/e,r.ty/t),c.invert(),o.uniforms.uMapCoord=h.mapCoord,o.uniforms.uClampFrame=h.uClampFrame,o.uniforms.uClampOffset=h.uClampOffset,o.uniforms.uTextureTransform=c,o.uniforms.uSizeAnchor[0]=e,o.uniforms.uSizeAnchor[1]=t,o.uniforms.uSizeAnchor[2]=s,o.uniforms.uSizeAnchor[3]=n,i&&(this.resources.uTexture=i.source,this.resources.uSampler=i.source.style)}}class St extends ${constructor(){super({positions:new Float32Array([0,0,1,0,1,1,0,1]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])})}}function Rt(a,e){const t=a.anchor.x,r=a.anchor.y;e[0]=-t*a.width,e[1]=-r*a.height,e[2]=(1-t)*a.width,e[3]=-r*a.height,e[4]=(1-t)*a.width,e[5]=(1-r)*a.height,e[6]=-t*a.width,e[7]=(1-r)*a.height}function Ut(a,e,t,r){let s=0;const n=a.length/e,i=r.a,o=r.b,u=r.c,l=r.d,h=r.tx,c=r.ty;for(t*=e;s<n;){const d=a[t],f=a[t+1];a[t]=i*d+u*f+h,a[t+1]=o*d+l*f+c,t+=e,s++}}function Bt(a,e){const t=a.texture,r=t.frame.width,s=t.frame.height;let n=0,i=0;a.applyAnchorToTexture&&(n=a.anchor.x,i=a.anchor.y),e[0]=e[6]=-n,e[2]=e[4]=1-n,e[1]=e[3]=-i,e[5]=e[7]=1-i;const o=T.shared;o.copyFrom(a._tileTransform.matrix),o.tx/=a.width,o.ty/=a.height,o.invert(),o.scale(a.width/r,a.height/s),Ut(e,2,0,o)}const B=new St;class Ft{constructor(){this.canBatch=!0,this.geometry=new $({indices:B.indices.slice(),positions:B.positions.slice(),uvs:B.uvs.slice()})}destroy(){var e;this.geometry.destroy(),(e=this.shader)==null||e.destroy()}}class Ae{constructor(e){this._state=F.default2d,this._renderer=e}validateRenderable(e){const t=this._getTilingSpriteData(e),r=t.canBatch;this._updateCanBatch(e);const s=t.canBatch;if(s&&s===r){const{batchableMesh:n}=t;return!n._batcher.checkAndUpdateTexture(n,e.texture)}return r!==s}addRenderable(e,t){const r=this._renderer.renderPipes.batch;this._updateCanBatch(e);const s=this._getTilingSpriteData(e),{geometry:n,canBatch:i}=s;if(i){s.batchableMesh||(s.batchableMesh=new Q);const o=s.batchableMesh;e.didViewUpdate&&(this._updateBatchableMesh(e),o.geometry=n,o.renderable=e,o.transform=e.groupTransform,o.setTexture(e._texture)),o.roundPixels=this._renderer._roundPixels|e._roundPixels,r.addToBatch(o,t)}else r.break(t),s.shader||(s.shader=new Pt),this.updateRenderable(e),t.add(e)}execute(e){const{shader:t}=this._getTilingSpriteData(e);t.groups[0]=this._renderer.globalUniforms.bindGroup;const r=t.resources.localUniforms.uniforms;r.uTransformMatrix=e.groupTransform,r.uRound=this._renderer._roundPixels|e._roundPixels,M(e.groupColorAlpha,r.uColor,0),this._state.blendMode=j(e.groupBlendMode,e.texture._source),this._renderer.encoder.draw({geometry:B,shader:t,state:this._state})}updateRenderable(e){const t=this._getTilingSpriteData(e),{canBatch:r}=t;if(r){const{batchableMesh:s}=t;e.didViewUpdate&&this._updateBatchableMesh(e),s._batcher.updateElement(s)}else if(e.didViewUpdate){const{shader:s}=t;s.updateUniforms(e.width,e.height,e._tileTransform.matrix,e.anchor.x,e.anchor.y,e.texture)}}_getTilingSpriteData(e){return e._gpuData[this._renderer.uid]||this._initTilingSpriteData(e)}_initTilingSpriteData(e){const t=new Ft;return t.renderable=e,e._gpuData[this._renderer.uid]=t,t}_updateBatchableMesh(e){const t=this._getTilingSpriteData(e),{geometry:r}=t,s=e.texture.source.style;s.addressMode!=="repeat"&&(s.addressMode="repeat",s.update()),Bt(e,r.uvs),Rt(e,r.positions)}destroy(){this._renderer=null}_updateCanBatch(e){const t=this._getTilingSpriteData(e),r=e.texture;let s=!0;return this._renderer.type===K.WEBGL&&(s=this._renderer.context.supports.nonPowOf2wrapping),t.canBatch=r.textureMatrix.isSimple&&(s||r.source.isPowerOfTwo),t.canBatch}}Ae.extension={type:[p.WebGLPipes,p.WebGPUPipes,p.CanvasPipes],name:"tilingSprite"};const Gt={name:"local-uniform-msdf-bit",vertex:{header:`
            struct LocalUniforms {
                uColor:vec4<f32>,
                uTransformMatrix:mat3x3<f32>,
                uDistance: f32,
                uRound:f32,
            }

            @group(2) @binding(0) var<uniform> localUniforms : LocalUniforms;
        `,main:`
            vColor *= localUniforms.uColor;
            modelMatrix *= localUniforms.uTransformMatrix;
        `,end:`
            if(localUniforms.uRound == 1)
            {
                vPosition = vec4(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
            }
        `},fragment:{header:`
            struct LocalUniforms {
                uColor:vec4<f32>,
                uTransformMatrix:mat3x3<f32>,
                uDistance: f32
            }

            @group(2) @binding(0) var<uniform> localUniforms : LocalUniforms;
         `,main:`
            outColor = vec4<f32>(calculateMSDFAlpha(outColor, localUniforms.uColor, localUniforms.uDistance));
        `}},Mt={name:"local-uniform-msdf-bit",vertex:{header:`
            uniform mat3 uTransformMatrix;
            uniform vec4 uColor;
            uniform float uRound;
        `,main:`
            vColor *= uColor;
            modelMatrix *= uTransformMatrix;
        `,end:`
            if(uRound == 1.)
            {
                gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
            }
        `},fragment:{header:`
            uniform float uDistance;
         `,main:`
            outColor = vec4(calculateMSDFAlpha(outColor, vColor, uDistance));
        `}},Dt={name:"msdf-bit",fragment:{header:`
            fn calculateMSDFAlpha(msdfColor:vec4<f32>, shapeColor:vec4<f32>, distance:f32) -> f32 {

                // MSDF
                var median = msdfColor.r + msdfColor.g + msdfColor.b -
                    min(msdfColor.r, min(msdfColor.g, msdfColor.b)) -
                    max(msdfColor.r, max(msdfColor.g, msdfColor.b));

                // SDF
                median = min(median, msdfColor.a);

                var screenPxDistance = distance * (median - 0.5);
                var alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);
                if (median < 0.01) {
                    alpha = 0.0;
                } else if (median > 0.99) {
                    alpha = 1.0;
                }

                // Gamma correction for coverage-like alpha
                var luma: f32 = dot(shapeColor.rgb, vec3<f32>(0.299, 0.587, 0.114));
                var gamma: f32 = mix(1.0, 1.0 / 2.2, luma);
                var coverage: f32 = pow(shapeColor.a * alpha, gamma);

                return coverage;

            }
        `}},At={name:"msdf-bit",fragment:{header:`
            float calculateMSDFAlpha(vec4 msdfColor, vec4 shapeColor, float distance) {

                // MSDF
                float median = msdfColor.r + msdfColor.g + msdfColor.b -
                                min(msdfColor.r, min(msdfColor.g, msdfColor.b)) -
                                max(msdfColor.r, max(msdfColor.g, msdfColor.b));

                // SDF
                median = min(median, msdfColor.a);

                float screenPxDistance = distance * (median - 0.5);
                float alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);

                if (median < 0.01) {
                    alpha = 0.0;
                } else if (median > 0.99) {
                    alpha = 1.0;
                }

                // Gamma correction for coverage-like alpha
                float luma = dot(shapeColor.rgb, vec3(0.299, 0.587, 0.114));
                float gamma = mix(1.0, 1.0 / 2.2, luma);
                float coverage = pow(shapeColor.a * alpha, gamma);

                return coverage;
            }
        `}};let I,O;class zt extends q{constructor(e){const t=new C({uColor:{value:new Float32Array([1,1,1,1]),type:"vec4<f32>"},uTransformMatrix:{value:new T,type:"mat3x3<f32>"},uDistance:{value:4,type:"f32"},uRound:{value:0,type:"f32"}});I??(I=fe({name:"sdf-shader",bits:[$e,je(e),Gt,Dt,pe]})),O??(O=me({name:"sdf-shader",bits:[qe,Qe(e),Mt,At,ge]})),super({glProgram:O,gpuProgram:I,resources:{localUniforms:t,batchSamplers:Je(e)}})}}class kt extends rt{destroy(){this.context.customShader&&this.context.customShader.destroy(),super.destroy()}}class ze{constructor(e){this._renderer=e}validateRenderable(e){const t=this._getGpuBitmapText(e);return this._renderer.renderPipes.graphics.validateRenderable(t)}addRenderable(e,t){const r=this._getGpuBitmapText(e);le(e,r),e._didTextUpdate&&(e._didTextUpdate=!1,this._updateContext(e,r)),this._renderer.renderPipes.graphics.addRenderable(r,t),r.context.customShader&&this._updateDistanceField(e)}updateRenderable(e){const t=this._getGpuBitmapText(e);le(e,t),this._renderer.renderPipes.graphics.updateRenderable(t),t.context.customShader&&this._updateDistanceField(e)}_updateContext(e,t){const{context:r}=t,s=Ze.getFont(e.text,e._style);r.clear(),s.distanceField.type!=="none"&&(r.customShader||(r.customShader=new zt(this._renderer.limits.maxBatchableTextures)));const n=et.graphemeSegmenter(e.text),i=e._style;let o=s.baseLineOffset;const u=tt(n,i,s,!0),l=i.padding,h=u.scale;let c=u.width,d=u.height+u.offsetY;i._stroke&&(c+=i._stroke.width/h,d+=i._stroke.width/h),r.translate(-e._anchor._x*c-l,-e._anchor._y*d-l).scale(h,h);const f=s.applyFillAsTint?i._fill.color:16777215;let _=s.fontMetrics.fontSize,x=s.lineHeight;i.lineHeight&&(_=i.fontSize/h,x=i.lineHeight/h);let g=(x-_)/2;g-s.baseLineOffset<0&&(g=0);for(let m=0;m<u.lines.length;m++){const P=u.lines[m];for(let S=0;S<P.charPositions.length;S++){const Ve=P.chars[S],w=s.chars[Ve];if(w!=null&&w.texture){const D=w.texture;r.texture(D,f||"black",Math.round(P.charPositions[S]+w.xOffset),Math.round(o+w.yOffset+g),D.orig.width,D.orig.height)}}o+=x}}_getGpuBitmapText(e){return e._gpuData[this._renderer.uid]||this.initGpuText(e)}initGpuText(e){const t=new kt;return e._gpuData[this._renderer.uid]=t,this._updateContext(e,t),t}_updateDistanceField(e){const t=this._getGpuBitmapText(e).context,r=e._style.fontFamily,s=H.get(`${r}-bitmap`),{a:n,b:i,c:o,d:u}=e.groupTransform,l=Math.sqrt(n*n+i*i),h=Math.sqrt(o*o+u*u),c=(Math.abs(l)+Math.abs(h))/2,d=s.baseRenderedFontSize/e._style.fontSize,f=c*s.distanceField.range*(1/d);t.customShader.resources.localUniforms.uniforms.uDistance=f}destroy(){this._renderer=null}}ze.extension={type:[p.WebGLPipes,p.WebGPUPipes,p.CanvasPipes],name:"bitmapText"};function le(a,e){e.groupTransform=a.groupTransform,e.groupColorAlpha=a.groupColorAlpha,e.groupColor=a.groupColor,e.groupBlendMode=a.groupBlendMode,e.globalDisplayStatus=a.globalDisplayStatus,e.groupTransform=a.groupTransform,e.localDisplayStatus=a.localDisplayStatus,e.groupAlpha=a.groupAlpha,e._roundPixels=a._roundPixels}class It extends _e{constructor(e){super(),this.generatingTexture=!1,this.currentKey="--",this._renderer=e,e.runners.resolutionChange.add(this)}resolutionChange(){const e=this.renderable;e._autoResolution&&e.onViewUpdate()}destroy(){const{htmlText:e}=this._renderer;e.getReferenceCount(this.currentKey)===null?e.returnTexturePromise(this.texturePromise):e.decreaseReferenceCount(this.currentKey),this._renderer.runners.resolutionChange.remove(this),this.texturePromise=null,this._renderer=null}}function X(a,e){const{texture:t,bounds:r}=a,s=e._style._getFinalPadding();st(r,e._anchor,t);const n=e._anchor._x*s*2,i=e._anchor._y*s*2;r.minX-=s-n,r.minY-=s-i,r.maxX-=s-n,r.maxY-=s-i}class ke{constructor(e){this._renderer=e}validateRenderable(e){const t=this._getGpuText(e),r=e.styleKey;return t.currentKey!==r}addRenderable(e,t){const r=this._getGpuText(e);if(e._didTextUpdate){const s=e._autoResolution?this._renderer.resolution:e.resolution;(r.currentKey!==e.styleKey||e.resolution!==s)&&this._updateGpuText(e).catch(n=>{console.error(n)}),e._didTextUpdate=!1,X(r,e)}this._renderer.renderPipes.batch.addToBatch(r,t)}updateRenderable(e){const t=this._getGpuText(e);t._batcher.updateElement(t)}async _updateGpuText(e){e._didTextUpdate=!1;const t=this._getGpuText(e);if(t.generatingTexture)return;const r=t.texturePromise;t.texturePromise=null,t.generatingTexture=!0,e._resolution=e._autoResolution?this._renderer.resolution:e.resolution;let s=this._renderer.htmlText.getTexturePromise(e);r&&(s=s.finally(()=>{this._renderer.htmlText.decreaseReferenceCount(t.currentKey),this._renderer.htmlText.returnTexturePromise(r)})),t.texturePromise=s,t.currentKey=e.styleKey,t.texture=await s;const n=e.renderGroup||e.parentRenderGroup;n&&(n.structureDidChange=!0),t.generatingTexture=!1,X(t,e)}_getGpuText(e){return e._gpuData[this._renderer.uid]||this.initGpuText(e)}initGpuText(e){const t=new It(this._renderer);return t.renderable=e,t.transform=e.groupTransform,t.texture=v.EMPTY,t.bounds={minX:0,maxX:1,minY:0,maxY:0},t.roundPixels=this._renderer._roundPixels|e._roundPixels,e._resolution=e._autoResolution?this._renderer.resolution:e.resolution,e._gpuData[this._renderer.uid]=t,t}destroy(){this._renderer=null}}ke.extension={type:[p.WebGLPipes,p.WebGPUPipes,p.CanvasPipes],name:"htmlText"};function Ot(){const{userAgent:a}=N.get().getNavigator();return/^((?!chrome|android).)*safari/i.test(a)}const Wt=new he;function Ie(a,e,t,r){const s=Wt;s.minX=0,s.minY=0,s.maxX=a.width/r|0,s.maxY=a.height/r|0;const n=b.getOptimalTexture(s.width,s.height,r,!1);return n.source.uploadMethodId="image",n.source.resource=a,n.source.alphaMode="premultiply-alpha-on-upload",n.frame.width=e/r,n.frame.height=t/r,n.source.emit("update",n.source),n.updateUvs(),n}function Et(a,e){const t=e.fontFamily,r=[],s={},n=/font-family:([^;"\s]+)/g,i=a.match(n);function o(u){s[u]||(r.push(u),s[u]=!0)}if(Array.isArray(t))for(let u=0;u<t.length;u++)o(t[u]);else o(t);i&&i.forEach(u=>{const l=u.split(":")[1].trim();o(l)});for(const u in e.tagStyles){const l=e.tagStyles[u].fontFamily;o(l)}return r}async function Vt(a){const t=await(await N.get().fetch(a)).blob(),r=new FileReader;return await new Promise((n,i)=>{r.onloadend=()=>n(r.result),r.onerror=i,r.readAsDataURL(t)})}async function Lt(a,e){const t=await Vt(e);return`@font-face {
        font-family: "${a.fontFamily}";
        font-weight: ${a.fontWeight};
        font-style: ${a.fontStyle};
        src: url('${t}');
    }`}const W=new Map;async function Yt(a){const e=a.filter(t=>H.has(`${t}-and-url`)).map(t=>{if(!W.has(t)){const{entries:r}=H.get(`${t}-and-url`),s=[];r.forEach(n=>{const i=n.url,u=n.faces.map(l=>({weight:l.weight,style:l.style}));s.push(...u.map(l=>Lt({fontWeight:l.weight,fontStyle:l.style,fontFamily:t},i)))}),W.set(t,Promise.all(s).then(n=>n.join(`
`)))}return W.get(t)});return(await Promise.all(e)).join(`
`)}function Ht(a,e,t,r,s){const{domElement:n,styleElement:i,svgRoot:o}=s;n.innerHTML=`<style>${e.cssStyle}</style><div style='padding:0;'>${a}</div>`,n.setAttribute("style",`transform: scale(${t});transform-origin: top left; display: inline-block`),i.textContent=r;const{width:u,height:l}=s.image;return o.setAttribute("width",u.toString()),o.setAttribute("height",l.toString()),new XMLSerializer().serializeToString(o)}function Xt(a,e){const t=xe.getOptimalCanvasAndContext(a.width,a.height,e),{context:r}=t;return r.clearRect(0,0,a.width,a.height),r.drawImage(a,0,0),t}function Kt(a,e,t){return new Promise(async r=>{t&&await new Promise(s=>setTimeout(s,100)),a.onload=()=>{r()},a.src=`data:image/svg+xml;charset=utf8,${encodeURIComponent(e)}`,a.crossOrigin="anonymous"})}class Oe{constructor(e){this._activeTextures={},this._renderer=e,this._createCanvas=e.type===K.WEBGPU}getTexture(e){return this.getTexturePromise(e)}getManagedTexture(e){const t=e.styleKey;if(this._activeTextures[t])return this._increaseReferenceCount(t),this._activeTextures[t].promise;const r=this._buildTexturePromise(e).then(s=>(this._activeTextures[t].texture=s,s));return this._activeTextures[t]={texture:null,promise:r,usageCount:1},r}getReferenceCount(e){var t;return((t=this._activeTextures[e])==null?void 0:t.usageCount)??null}_increaseReferenceCount(e){this._activeTextures[e].usageCount++}decreaseReferenceCount(e){const t=this._activeTextures[e];t&&(t.usageCount--,t.usageCount===0&&(t.texture?this._cleanUp(t.texture):t.promise.then(r=>{t.texture=r,this._cleanUp(t.texture)}).catch(()=>{E("HTMLTextSystem: Failed to clean texture")}),this._activeTextures[e]=null))}getTexturePromise(e){return this._buildTexturePromise(e)}async _buildTexturePromise(e){const{text:t,style:r,resolution:s,textureStyle:n}=e,i=G.get(we),o=Et(t,r),u=await Yt(o),l=ct(t,r,u,i),h=Math.ceil(Math.ceil(Math.max(1,l.width)+r.padding*2)*s),c=Math.ceil(Math.ceil(Math.max(1,l.height)+r.padding*2)*s),d=i.image,f=2;d.width=(h|0)+f,d.height=(c|0)+f;const _=Ht(t,r,s,u,i);await Kt(d,_,Ot()&&o.length>0);const x=d;let g;this._createCanvas&&(g=Xt(d,s));const m=Ie(g?g.canvas:x,d.width-f,d.height-f,s);return n&&(m.source.style=n),this._createCanvas&&(this._renderer.texture.initSource(m.source),xe.returnCanvasAndContext(g)),G.return(i),m}returnTexturePromise(e){e.then(t=>{this._cleanUp(t)}).catch(()=>{E("HTMLTextSystem: Failed to clean texture")})}_cleanUp(e){b.returnTexture(e,!0),e.source.resource=null,e.source.uploadMethodId="unknown"}destroy(){this._renderer=null;for(const e in this._activeTextures)this._activeTextures[e]&&this.returnTexturePromise(this._activeTextures[e].promise);this._activeTextures=null}}Oe.extension={type:[p.WebGLSystem,p.WebGPUSystem,p.CanvasSystem],name:"htmlText"};class Nt extends _e{constructor(e){super(),this._renderer=e,e.runners.resolutionChange.add(this)}resolutionChange(){const e=this.renderable;e._autoResolution&&e.onViewUpdate()}destroy(){const{canvasText:e}=this._renderer;e.getReferenceCount(this.currentKey)>0?e.decreaseReferenceCount(this.currentKey):this.texture&&e.returnTexture(this.texture),this._renderer.runners.resolutionChange.remove(this),this._renderer=null}}class We{constructor(e){this._renderer=e}validateRenderable(e){const t=this._getGpuText(e),r=e.styleKey;return t.currentKey!==r?!0:e._didTextUpdate}addRenderable(e,t){const r=this._getGpuText(e);if(e._didTextUpdate){const s=e._autoResolution?this._renderer.resolution:e.resolution;(r.currentKey!==e.styleKey||e.resolution!==s)&&this._updateGpuText(e),e._didTextUpdate=!1}this._renderer.renderPipes.batch.addToBatch(r,t)}updateRenderable(e){const t=this._getGpuText(e);t._batcher.updateElement(t)}_updateGpuText(e){const t=this._getGpuText(e);t.texture&&this._renderer.canvasText.decreaseReferenceCount(t.currentKey),e._resolution=e._autoResolution?this._renderer.resolution:e.resolution,t.texture=this._renderer.canvasText.getManagedTexture(e),t.currentKey=e.styleKey,X(t,e)}_getGpuText(e){return e._gpuData[this._renderer.uid]||this.initGpuText(e)}initGpuText(e){const t=new Nt(this._renderer);return t.currentKey="--",t.renderable=e,t.transform=e.groupTransform,t.bounds={minX:0,maxX:1,minY:0,maxY:0},t.roundPixels=this._renderer._roundPixels|e._roundPixels,e._gpuData[this._renderer.uid]=t,t}destroy(){this._renderer=null}}We.extension={type:[p.WebGLPipes,p.WebGPUPipes,p.CanvasPipes],name:"text"};class Ee{constructor(e){this._activeTextures={},this._renderer=e}getTexture(e,t,r,s){typeof e=="string"&&(V("8.0.0","CanvasTextSystem.getTexture: Use object TextOptions instead of separate arguments"),e={text:e,style:r,resolution:t}),e.style instanceof ee||(e.style=new ee(e.style)),e.textureStyle instanceof Y||(e.textureStyle=new Y(e.textureStyle)),typeof e.text!="string"&&(e.text=e.text.toString());const{text:n,style:i,textureStyle:o}=e,u=e.resolution??this._renderer.resolution,{frame:l,canvasAndContext:h}=A.getCanvasAndContext({text:n,style:i,resolution:u}),c=Ie(h.canvas,l.width,l.height,u);if(o&&(c.source.style=o),i.trim&&(l.pad(i.padding),c.frame.copyFrom(l),c.frame.scale(1/u),c.updateUvs()),i.filters){const d=this._applyFilters(c,i.filters);return this.returnTexture(c),A.returnCanvasAndContext(h),d}return this._renderer.texture.initSource(c._source),A.returnCanvasAndContext(h),c}returnTexture(e){const t=e.source;t.resource=null,t.uploadMethodId="unknown",t.alphaMode="no-premultiply-alpha",b.returnTexture(e,!0)}renderTextToCanvas(){V("8.10.0","CanvasTextSystem.renderTextToCanvas: no longer supported, use CanvasTextSystem.getTexture instead")}getManagedTexture(e){e._resolution=e._autoResolution?this._renderer.resolution:e.resolution;const t=e.styleKey;if(this._activeTextures[t])return this._increaseReferenceCount(t),this._activeTextures[t].texture;const r=this.getTexture({text:e.text,style:e.style,resolution:e._resolution,textureStyle:e.textureStyle});return this._activeTextures[t]={texture:r,usageCount:1},r}decreaseReferenceCount(e){const t=this._activeTextures[e];t.usageCount--,t.usageCount===0&&(this.returnTexture(t.texture),this._activeTextures[e]=null)}getReferenceCount(e){var t;return((t=this._activeTextures[e])==null?void 0:t.usageCount)??0}_increaseReferenceCount(e){this._activeTextures[e].usageCount++}_applyFilters(e,t){const r=this._renderer.renderTarget.renderTarget,s=this._renderer.filter.generateFilteredTexture({texture:e,filters:t});return this._renderer.renderTarget.bind(r,!1),s}destroy(){this._renderer=null;for(const e in this._activeTextures)this._activeTextures[e]&&this.returnTexture(this._activeTextures[e].texture);this._activeTextures=null}}Ee.extension={type:[p.WebGLSystem,p.WebGPUSystem,p.CanvasSystem],name:"canvasText"};y.add(ye);y.add(be);y.add(Ce);y.add(nt);y.add(Re);y.add(Be);y.add(Fe);y.add(Ee);y.add(We);y.add(ze);y.add(Oe);y.add(ke);y.add(Ae);y.add(De);y.add(ve);y.add(Te);
//# sourceMappingURL=webworkerAll-BAevQDz6.js.map
