(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))l(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const f of i.addedNodes)f.tagName==="LINK"&&f.rel==="modulepreload"&&l(f)}).observe(document,{childList:!0,subtree:!0});function n(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function l(s){if(s.ep)return;s.ep=!0;const i=n(s);fetch(s.href,i)}})();let _=j;const y=1,A=2,I={owned:null,cleanups:null,context:null,owner:null};var u=null;let b=null,$=null,a=null,p=null,w=null,C=0;function G(e,t){const n=a,l=u,s=e.length===0,i=t===void 0?l:t,f=s?I:{owned:null,cleanups:null,context:i?i.context:null,owner:i},o=s?e:()=>e(()=>L(()=>m(f)));u=f,a=null;try{return E(o,!0)}finally{a=n,u=l}}function N(e,t,n){const l=q(e,t,!1,y);U(l)}function L(e){if(a===null)return e();const t=a;a=null;try{return e()}finally{a=t}}function V(e,t,n){let l=e.value;return(!e.comparator||!e.comparator(l,t))&&(e.value=t,e.observers&&e.observers.length&&E(()=>{for(let s=0;s<e.observers.length;s+=1){const i=e.observers[s],f=b&&b.running;f&&b.disposed.has(i),(f?!i.tState:!i.state)&&(i.pure?p.push(i):w.push(i),i.observers&&D(i)),f||(i.state=y)}if(p.length>1e6)throw p=[],new Error},!1)),t}function U(e){if(!e.fn)return;m(e);const t=C;W(e,e.value,t)}function W(e,t,n){let l;const s=u,i=a;a=u=e;try{l=e.fn(t)}catch(f){return e.pure&&(e.state=y,e.owned&&e.owned.forEach(m),e.owned=null),e.updatedAt=n+1,F(f)}finally{a=i,u=s}(!e.updatedAt||e.updatedAt<=n)&&(e.updatedAt!=null&&"observers"in e?V(e,l):e.value=l,e.updatedAt=n)}function q(e,t,n,l=y,s){const i={fn:e,state:l,updatedAt:null,owned:null,sources:null,sourceSlots:null,cleanups:null,value:t,owner:u,context:u?u.context:null,pure:n};return u===null||u!==I&&(u.owned?u.owned.push(i):u.owned=[i]),i}function R(e){if(e.state===0)return;if(e.state===A)return T(e);if(e.suspense&&L(e.suspense.inFallback))return e.suspense.effects.push(e);const t=[e];for(;(e=e.owner)&&(!e.updatedAt||e.updatedAt<C);)e.state&&t.push(e);for(let n=t.length-1;n>=0;n--)if(e=t[n],e.state===y)U(e);else if(e.state===A){const l=p;p=null,E(()=>T(e,t[0]),!1),p=l}}function E(e,t){if(p)return e();let n=!1;t||(p=[]),w?n=!0:w=[],C++;try{const l=e();return H(n),l}catch(l){n||(w=null),p=null,F(l)}}function H(e){if(p&&(j(p),p=null),e)return;const t=w;w=null,t.length&&E(()=>_(t),!1)}function j(e){for(let t=0;t<e.length;t++)R(e[t])}function T(e,t){e.state=0;for(let n=0;n<e.sources.length;n+=1){const l=e.sources[n];if(l.sources){const s=l.state;s===y?l!==t&&(!l.updatedAt||l.updatedAt<C)&&R(l):s===A&&T(l,t)}}}function D(e){for(let t=0;t<e.observers.length;t+=1){const n=e.observers[t];n.state||(n.state=A,n.pure?p.push(n):w.push(n),n.observers&&D(n))}}function m(e){let t;if(e.sources)for(;e.sources.length;){const n=e.sources.pop(),l=e.sourceSlots.pop(),s=n.observers;if(s&&s.length){const i=s.pop(),f=n.observerSlots.pop();l<s.length&&(i.sourceSlots[f]=l,s[l]=i,n.observerSlots[l]=f)}}if(e.tOwned){for(t=e.tOwned.length-1;t>=0;t--)m(e.tOwned[t]);delete e.tOwned}if(e.owned){for(t=e.owned.length-1;t>=0;t--)m(e.owned[t]);e.owned=null}if(e.cleanups){for(t=e.cleanups.length-1;t>=0;t--)e.cleanups[t]();e.cleanups=null}e.state=0}function J(e){return e instanceof Error?e:new Error(typeof e=="string"?e:"Unknown error",{cause:e})}function F(e,t=u){throw J(e)}function K(e,t){return L(()=>e(t||{}))}function Q(e,t,n){let l=n.length,s=t.length,i=l,f=0,o=0,r=t[s-1].nextSibling,h=null;for(;f<s||o<i;){if(t[f]===n[o]){f++,o++;continue}for(;t[s-1]===n[i-1];)s--,i--;if(s===f){const c=i<l?o?n[o-1].nextSibling:n[i-o]:r;for(;o<i;)e.insertBefore(n[o++],c)}else if(i===o)for(;f<s;)(!h||!h.has(t[f]))&&t[f].remove(),f++;else if(t[f]===n[i-1]&&n[o]===t[s-1]){const c=t[--s].nextSibling;e.insertBefore(n[o++],t[f++].nextSibling),e.insertBefore(n[--i],c),t[s]=n[i]}else{if(!h){h=new Map;let d=o;for(;d<i;)h.set(n[d],d++)}const c=h.get(t[f]);if(c!=null)if(o<c&&c<i){let d=f,S=1,B;for(;++d<s&&d<i&&!((B=h.get(t[d]))==null||B!==c+S);)S++;if(S>c-o){const M=t[f];for(;o<c;)e.insertBefore(n[o++],M)}else e.replaceChild(n[o++],t[f++])}else f++;else t[f++].remove()}}}function X(e,t,n,l={}){let s;return G(i=>{s=i,t===document?e():Y(t,e(),t.firstChild?null:void 0,n)},l.owner),()=>{s(),t.textContent=""}}function v(e,t,n){let l;const s=()=>{const f=document.createElement("template");return f.innerHTML=e,f.content.firstChild},i=()=>(l||(l=s())).cloneNode(!0);return i.cloneNode=i,i}function Y(e,t,n,l){if(n!==void 0&&!l&&(l=[]),typeof t!="function")return x(e,t,l,n);N(s=>x(e,t(),s,n),l)}function x(e,t,n,l,s){for(;typeof n=="function";)n=n();if(t===n)return n;const i=typeof t,f=l!==void 0;if(e=f&&n[0]&&n[0].parentNode||e,i==="string"||i==="number"){if(i==="number"&&(t=t.toString(),t===n))return n;if(f){let o=n[0];o&&o.nodeType===3?o.data!==t&&(o.data=t):o=document.createTextNode(t),n=g(e,n,l,o)}else n!==""&&typeof n=="string"?n=e.firstChild.data=t:n=e.textContent=t}else if(t==null||i==="boolean")n=g(e,n,l);else{if(i==="function")return N(()=>{let o=t();for(;typeof o=="function";)o=o();n=x(e,o,n,l)}),()=>n;if(Array.isArray(t)){const o=[],r=n&&Array.isArray(n);if(O(o,t,n,s))return N(()=>n=x(e,o,n,l,!0)),()=>n;if(o.length===0){if(n=g(e,n,l),f)return n}else r?n.length===0?P(e,o,l):Q(e,n,o):(n&&g(e),P(e,o));n=o}else if(t.nodeType){if(Array.isArray(n)){if(f)return n=g(e,n,l,t);g(e,n,null,t)}else n==null||n===""||!e.firstChild?e.appendChild(t):e.replaceChild(t,e.firstChild);n=t}}return n}function O(e,t,n,l){let s=!1;for(let i=0,f=t.length;i<f;i++){let o=t[i],r=n&&n[e.length],h;if(!(o==null||o===!0||o===!1))if((h=typeof o)=="object"&&o.nodeType)e.push(o);else if(Array.isArray(o))s=O(e,o,r)||s;else if(h==="function")if(l){for(;typeof o=="function";)o=o();s=O(e,Array.isArray(o)?o:[o],Array.isArray(r)?r:[r])||s}else e.push(o),s=!0;else{const c=String(o);r&&r.nodeType===3&&r.data===c?e.push(r):e.push(document.createTextNode(c))}}return s}function P(e,t,n=null){for(let l=0,s=t.length;l<s;l++)e.insertBefore(t[l],n)}function g(e,t,n,l){if(n===void 0)return e.textContent="";const s=l||document.createTextNode("");if(t.length){let i=!1;for(let f=t.length-1;f>=0;f--){const o=t[f];if(s!==o){const r=o.parentNode===e;!i&&!f?r?e.replaceChild(s,o):e.insertBefore(s,n):r&&o.remove()}else i=!0}}else e.insertBefore(s,n);return[s]}var Z=v("<h1>Justin Ng Wei Shung"),z=v("<p>Resume at LinkedIn Profile <a href=https://www.linkedin.com/in/justin-ng-wei-shung/>https://www.linkedin.com/in/justin-ng-wei-shung/"),k=v("<canvas id=responsive-canvas>");function ee(){return[Z(),z(),k()]}const te=document.getElementById("root");X(()=>K(ee,{}),te);
