"use strict";(self.webpackChunksaito=self.webpackChunksaito||[]).push([[162],{6162:(e,r,t)=>{t.r(r),t.d(r,{BaseHash:()=>i.BaseHash,BaseHashReader:()=>i.BaseHashReader,BrowserHasher:()=>i.BrowserHasher,createHash:()=>i.createHash,createKeyed:()=>i.createKeyed,defaultHashLength:()=>i.defaultHashLength,deriveKey:()=>i.deriveKey,hash:()=>i.hash,inputToArray:()=>i.inputToArray,keyedHash:()=>i.keyedHash,maxHashBytes:()=>i.maxHashBytes,using:()=>i.using});var a={};t.r(a),t.d(a,{Blake3Hash:()=>s.Tf,HashReader:()=>s.g1,__wbindgen_throw:()=>s.Or,create_derive:()=>s.q0,create_hasher:()=>s.dM,create_keyed:()=>s.jf,hash:()=>s.vp});var n=t(23380),s=t(97741),i=t(51425);(0,n.E)(a)},97741:(e,r,t)=>{t.d(r,{vp:()=>_,dM:()=>c,jf:()=>d,q0:()=>f,Tf:()=>y,g1:()=>b,Or:()=>g});var a=t(78928);e=t.hmd(e);let n=new("undefined"==typeof TextDecoder?(0,e.require)("util").TextDecoder:TextDecoder)("utf-8",{ignoreBOM:!0,fatal:!0});n.decode();let s=null;function i(){return null!==s&&s.buffer===a.memory.buffer||(s=new Uint8Array(a.memory.buffer)),s}let o=0;function h(e,r){const t=r(1*e.length);return i().set(e,t/1),o=e.length,t}function _(e,r){try{var t=h(e,a.__wbindgen_malloc),n=o,s=h(r,a.__wbindgen_malloc),_=o;a.hash(t,n,s,_)}finally{r.set(i().subarray(s/1,s/1+_)),a.__wbindgen_free(s,1*_)}}function c(){var e=a.create_hasher();return y.__wrap(e)}function d(e){var r=h(e,a.__wbindgen_malloc),t=o,n=a.create_keyed(r,t);return y.__wrap(n)}let l=new("undefined"==typeof TextEncoder?(0,e.require)("util").TextEncoder:TextEncoder)("utf-8");const u="function"==typeof l.encodeInto?function(e,r){return l.encodeInto(e,r)}:function(e,r){const t=l.encode(e);return r.set(t),{read:e.length,written:t.length}};function f(e){var r=function(e,r,t){if(void 0===t){const t=l.encode(e),a=r(t.length);return i().subarray(a,a+t.length).set(t),o=t.length,a}let a=e.length,n=r(a);const s=i();let h=0;for(;h<a;h++){const r=e.charCodeAt(h);if(r>127)break;s[n+h]=r}if(h!==a){0!==h&&(e=e.slice(h)),n=t(n,a,a=h+3*e.length);const r=i().subarray(n+h,n+a);h+=u(e,r).written}return o=h,n}(e,a.__wbindgen_malloc,a.__wbindgen_realloc),t=o,n=a.create_derive(r,t);return y.__wrap(n)}const p=new Uint32Array(2),w=new BigUint64Array(p.buffer);class y{static __wrap(e){const r=Object.create(y.prototype);return r.ptr=e,r}free(){const e=this.ptr;this.ptr=0,a.__wbg_blake3hash_free(e)}reader(){var e=a.blake3hash_reader(this.ptr);return b.__wrap(e)}update(e){var r=h(e,a.__wbindgen_malloc),t=o;a.blake3hash_update(this.ptr,r,t)}digest(e){try{var r=h(e,a.__wbindgen_malloc),t=o;a.blake3hash_digest(this.ptr,r,t)}finally{e.set(i().subarray(r/1,r/1+t)),a.__wbindgen_free(r,1*t)}}}class b{static __wrap(e){const r=Object.create(b.prototype);return r.ptr=e,r}free(){const e=this.ptr;this.ptr=0,a.__wbg_hashreader_free(e)}fill(e){try{var r=h(e,a.__wbindgen_malloc),t=o;a.hashreader_fill(this.ptr,r,t)}finally{e.set(i().subarray(r/1,r/1+t)),a.__wbindgen_free(r,1*t)}}set_position(e){w[0]=e;const r=p[0],t=p[1];a.hashreader_set_position(this.ptr,r,t)}}const g=function(e,r){throw new Error((t=e,a=r,n.decode(i().subarray(t,t+a))));var t,a}},78928:(e,r,t)=>{var a=t.w[e.id];e.exports=a;t(97741);a[""]()}}]);