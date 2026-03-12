(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function e(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(n){if(n.ep)return;n.ep=!0;const a=e(n);fetch(n.href,a)}})();const W="/api";function Y(){return localStorage.getItem("shiptrack_token")}async function g(t,i,e){const o=Y(),n={"Content-Type":"application/json"};o&&(n.Authorization=`Bearer ${o}`);const a=await fetch(`${W}${i}`,{method:t,headers:n,body:e?JSON.stringify(e):void 0});if(!a.ok){const s=await a.json().catch(()=>({error:a.statusText}));throw new Error(s.error||"Request failed")}return a.json()}const x={login:(t,i)=>g("POST","/auth/login",{email:t,password:i}),me:()=>g("GET","/auth/me"),shipments:(t={})=>{const i=new URLSearchParams(t).toString();return g("GET",`/shipments${i?"?"+i:""}`)},shipment:t=>g("GET",`/shipments/${t}`),createShipment:t=>g("POST","/shipments",t),deleteShipment:t=>g("DELETE",`/shipments/${t}`),injectEvent:(t,i)=>g("POST",`/shipments/${t}/events`,i),carriers:()=>g("GET","/shipments/meta/carriers"),publicTrack:t=>fetch(`${W}/tracking/${t}`).then(i=>i.json()),notifPrefs:()=>g("GET","/shipments/notifications/prefs"),saveNotifPrefs:t=>g("PUT","/shipments/notifications/prefs",t),notifLog:()=>g("GET","/shipments/notifications/log"),analyticsSummary:()=>g("GET","/analytics/summary"),carrierSla:()=>g("GET","/analytics/carrier-sla"),volume:()=>g("GET","/analytics/volume"),routes:()=>g("GET","/analytics/routes"),chat:t=>g("POST","/chat",{message:t})},L=[{email:"customer@demo.com",password:"demo",role:"customer",icon:"📦",name:"Customer",desc:"Track your orders"},{email:"shipper@demo.com",password:"demo",role:"shipper",icon:"🏭",name:"Shipper",desc:"Manage all shipments"},{email:"ops@demo.com",password:"demo",role:"ops",icon:"🎛️",name:"Ops Team",desc:"Full platform access"}];async function J(t){t.innerHTML=`
    <div class="login-page">
      <div class="login-bg-glow"></div>
      <div class="login-bg-glow-2"></div>
      <div class="login-card animate-in">
        <div class="login-logo">
          <span class="login-logo-icon">📦</span>
          <span class="login-logo-text">ShipTrack</span>
        </div>
        <p class="login-subtitle">Real-time shipment visibility platform. Sign in to access live tracking, alerts, and analytics.</p>

        <div class="form-group">
          <label class="form-label">Select your role</label>
          <div class="role-grid">
            ${L.map((e,o)=>`
              <div class="role-btn ${o===0?"selected":""}" data-idx="${o}">
                <div class="role-btn-icon">${e.icon}</div>
                <div class="role-btn-name">${e.name}</div>
                <div class="role-btn-desc">${e.desc}</div>
              </div>`).join("")}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input id="login-email" class="input" type="email" value="${L[0].email}" />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input id="login-password" class="input" type="password" value="demo" />
        </div>

        <div id="login-error" class="login-error" style="display:none"></div>

        <button id="login-btn" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:4px">
          <span>Sign In</span> <span>→</span>
        </button>

        <p style="text-align:center;font-size:12px;color:var(--text-3);margin-top:16px">
          All credentials are pre-filled for demo purposes
        </p>
      </div>
    </div>`;let i=0;t.querySelectorAll(".role-btn").forEach(e=>{e.addEventListener("click",()=>{t.querySelectorAll(".role-btn").forEach(n=>n.classList.remove("selected")),e.classList.add("selected"),i=+e.dataset.idx;const o=L[i];document.getElementById("login-email").value=o.email,document.getElementById("login-password").value=o.password})}),document.getElementById("login-btn").addEventListener("click",async()=>{const e=document.getElementById("login-email").value.trim(),o=document.getElementById("login-password").value,n=document.getElementById("login-error"),a=document.getElementById("login-btn");n.style.display="none",a.disabled=!0,a.innerHTML='<span class="spinner" style="width:18px;height:18px;border-width:2px"></span>';try{const{token:s,user:d}=await x.login(e,o);he(d,s),window.navigate("#/shipments"),location.reload()}catch(s){n.textContent=s.message,n.style.display="block",a.disabled=!1,a.innerHTML="<span>Sign In</span> <span>→</span>"}})}function V(t){const i=document.createElement("div");i.className="modal-backdrop",i.innerHTML=`
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">Create New Shipment</div>
        <button class="btn btn-ghost btn-sm close-modal">✕</button>
      </div>
      <div class="modal-body">
        <form id="add-shipment-form">
          <div class="input-group" style="flex-direction:column;align-items:start;gap:6px;margin-bottom:12px">
            <label style="font-size:12px;color:var(--text-3);font-weight:600">Tracking Number *</label>
            <input name="trackingNumber" class="input" required placeholder="e.g. TRK-999" style="width:100%" />
          </div>
          
          <div class="input-group" style="flex-direction:column;align-items:start;gap:6px;margin-bottom:12px">
            <label style="font-size:12px;color:var(--text-3);font-weight:600">Carrier *</label>
            <select name="carrier" class="select" required style="width:100%">
              <option value="fedex">FedEx</option>
              <option value="ups">UPS</option>
              <option value="dhl">DHL</option>
              <option value="maersk">Maersk</option>
            </select>
          </div>

          <div class="input-group" style="flex-direction:column;align-items:start;gap:6px;margin-bottom:12px">
            <label style="font-size:12px;color:var(--text-3);font-weight:600">Description</label>
            <input name="description" class="input" placeholder="e.g. Electronics" style="width:100%" />
          </div>

          <div class="input-group" style="flex-direction:column;align-items:start;gap:6px;margin-bottom:12px">
            <label style="font-size:12px;color:var(--text-3);font-weight:600">Customer Email (Optional)</label>
            <input name="customerEmail" type="email" class="input" placeholder="e.g. customer@demo.com" style="width:100%" />
          </div>

          <div style="display:flex;gap:12px;margin-bottom:12px">
            <div class="input-group" style="flex:1;flex-direction:column;align-items:start;gap:6px">
              <label style="font-size:12px;color:var(--text-3);font-weight:600">Origin City *</label>
              <input name="originName" class="input" required placeholder="e.g. New York, NY" style="width:100%" />
            </div>
            <div class="input-group" style="flex:1;flex-direction:column;align-items:start;gap:6px">
              <label style="font-size:12px;color:var(--text-3);font-weight:600">Dest. City *</label>
              <input name="destName" class="input" required placeholder="e.g. London, UK" style="width:100%" />
            </div>
          </div>
          
          <!-- Mocking coordinates for simplicity -->
          <input type="hidden" name="originLat" value="40.7128" />
          <input type="hidden" name="originLng" value="-74.0060" />
          <input type="hidden" name="destLat" value="51.5074" />
          <input type="hidden" name="destLng" value="-0.1278" />

          <div style="display:flex;gap:12px;margin-bottom:20px">
            <div class="input-group" style="flex:1;flex-direction:column;align-items:start;gap:6px">
              <label style="font-size:12px;color:var(--text-3);font-weight:600">Weight</label>
              <input name="weight" class="input" placeholder="e.g. 5 kg" style="width:100%" />
            </div>
            <div class="input-group" style="flex:1;flex-direction:column;align-items:start;gap:6px">
              <label style="font-size:12px;color:var(--text-3);font-weight:600">Dimensions</label>
              <input name="dimensions" class="input" placeholder="e.g. 10x10x10" style="width:100%" />
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:12px">
            <button type="button" class="btn btn-ghost close-modal">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-shipment">Create Shipment</button>
          </div>
        </form>
      </div>
    </div>
  `,document.body.appendChild(i);const e=()=>i.remove();i.querySelectorAll(".close-modal").forEach(n=>n.onclick=e);const o=i.querySelector("#add-shipment-form");o.onsubmit=async n=>{n.preventDefault();const a=new FormData(o),s={trackingNumber:a.get("trackingNumber"),carrier:a.get("carrier"),description:a.get("description"),customerEmail:a.get("customerEmail"),origin:{name:a.get("originName"),lat:parseFloat(a.get("originLat")),lng:parseFloat(a.get("originLng"))},destination:{name:a.get("destName"),lat:parseFloat(a.get("destLat")),lng:parseFloat(a.get("destLng"))},weight:a.get("weight"),dimensions:a.get("dimensions"),service:"Standard"},d=o.querySelector("#btn-submit-shipment");d.disabled=!0,d.textContent="Creating...";try{await x.createShipment(s),e(),t&&t()}catch(l){alert("Error creating shipment: "+l.message),d.disabled=!1,d.textContent="Create Shipment"}}}const Q={in_transit:"In Transit",out_for_delivery:"Out for Delivery",delivered:"Delivered",delayed:"Delayed",awaiting_customs:"Awaiting Customs",exception:"Exception"},X={in_transit:"#60a5fa",out_for_delivery:"#34d399",delivered:"#10b981",delayed:"#fbbf24",awaiting_customs:"#a78bfa",exception:"#f87171"};function Z(t){if(!t)return"—";const i=new Date(t),o=(i-new Date)/36e5;return o<0?"Past due":o<1?`~${Math.round(o*60)} min`:o<24?`~${Math.round(o)}h`:i.toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}function ee(t,i=!1){return`<span class="status-badge ${t} ${i&&["out_for_delivery","in_transit"].includes(t)?"pulsing":""}">
    <span class="dot"></span>${Q[t]||t}
  </span>`}function I(t){return`
    <div class="shipment-card animate-in" data-id="${t.id}" style="--status-color:${X[t.status]||"var(--accent)"}">
      <div class="ship-card-head">
        <div class="ship-carrier">
          <div class="carrier-badge">${t.carrierLogo||"📦"}</div>
          <div class="carrier-info">
            <div class="carrier-name">${t.carrierName||t.carrier.toUpperCase()}</div>
            <div class="tracking-id">${t.trackingNumber}</div>
          </div>
        </div>
        ${ee(t.status,!0)}
      </div>

      <div class="ship-card-desc">${t.description}</div>

      <div class="ship-card-route">
        <span class="route-city">${t.origin.name}</span>
        <span class="route-arrow">──▶</span>
        <span class="route-city">${t.destination.name}</span>
      </div>

      <div class="ship-card-footer">
        <div>
          <div class="eta-label">Est. Delivery</div>
          <div class="eta-value">${Z(t.estimatedDelivery)}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          ${["shipper","ops"].includes(c==null?void 0:c.role)?`<button class="btn btn-ghost btn-sm delete-btn" data-id="${t.id}" title="Delete Shipment">🗑️</button>`:""}
          ${t.delayMinutes>0?`<span style="font-size:11.5px;color:var(--clr-delayed)">⚠ +${Math.round(t.delayMinutes/60)}h delay</span>`:""}
          <button class="btn btn-primary btn-sm track-btn" data-id="${t.id}">Track →</button>
        </div>
      </div>
    </div>`}async function te(t){t.innerHTML=`
    <div class="page-header" style="justify-content:space-between">
      <div>
        <div class="page-title">Shipments</div>
        <div class="page-subtitle">Monitor all your active shipments in real-time</div>
      </div>
      <div style="text-align:right">
        ${["shipper","ops"].includes(c==null?void 0:c.role)?'<button id="btn-add-shipment" class="btn btn-primary" style="margin-bottom:8px">➕ Add Shipment</button><br>':""}
        <div id="shipment-count" style="font-size:13px;color:var(--text-3)"></div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="input-group" style="flex:1;min-width:200px;max-width:340px">
        <span class="search-icon">🔍</span>
        <input id="search-input" class="input search-input" placeholder="Search tracking #, description…" />
      </div>
      <select id="status-filter" class="select">
        <option value="">All statuses</option>
        <option value="in_transit">In Transit</option>
        <option value="out_for_delivery">Out for Delivery</option>
        <option value="delayed">Delayed</option>
        <option value="awaiting_customs">Awaiting Customs</option>
        <option value="exception">Exception</option>
        <option value="delivered">Delivered</option>
      </select>
      <select id="carrier-filter" class="select">
        <option value="">All carriers</option>
        <option value="fedex">FedEx</option>
        <option value="ups">UPS</option>
        <option value="dhl">DHL</option>
        <option value="maersk">Maersk</option>
      </select>
    </div>

    <div id="shipments-grid" class="shipments-grid">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <span>Loading shipments…</span>
      </div>
    </div>`;let i=[];async function e(l={}){const p=document.getElementById("shipments-grid");try{if(i=await x.shipments(l),document.getElementById("shipment-count").textContent=`${i.length} shipment${i.length!==1?"s":""}`,i.length===0){p.innerHTML=`<div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">No shipments found</div>
          <div class="empty-desc">Try adjusting your filters or check back later.</div>
        </div>`;return}p.innerHTML=i.map((r,v)=>I(r).replace('animate-in"',"animate-in animate-in-delay-"+Math.min(v,3)+'"')).join(""),p.querySelectorAll(".track-btn").forEach(r=>{r.addEventListener("click",v=>{v.stopPropagation(),window.navigate(`#/tracking/${r.dataset.id}`)})}),p.querySelectorAll(".shipment-card").forEach(r=>{r.addEventListener("click",()=>window.navigate(`#/tracking/${r.dataset.id}`))}),p.querySelectorAll(".delete-btn").forEach(r=>{r.addEventListener("click",async v=>{if(v.stopPropagation(),confirm("Are you sure you want to delete this shipment?"))try{r.disabled=!0,await x.deleteShipment(r.dataset.id),e(a())}catch(u){alert("Failed to delete shipment: "+u.message),r.disabled=!1}})})}catch(r){p.innerHTML=`<div class="loading-overlay"><span style="color:var(--clr-exception)">❌ ${r.message}</span></div>`}}const o=document.getElementById("btn-add-shipment");o&&o.addEventListener("click",()=>{V(()=>e(a()))});let n;document.getElementById("search-input").addEventListener("input",l=>{clearTimeout(n),n=setTimeout(()=>s(),300)}),document.getElementById("status-filter").addEventListener("change",s),document.getElementById("carrier-filter").addEventListener("change",s);function a(){const l={},p=document.getElementById("search-input").value.trim(),r=document.getElementById("status-filter").value,v=document.getElementById("carrier-filter").value;return p&&(l.search=p),r&&(l.status=r),v&&(l.carrier=v),l}function s(){e(a())}const d=A(l=>{var h;if(l.type!=="shipment_update"&&l.type!=="position_update")return;const p=i.findIndex(y=>{var m;return y.id===((m=l.shipment)==null?void 0:m.id)});if(p===-1)return;i[p]={...i[p],...l.shipment};const r=document.querySelector(`.shipment-card[data-id="${l.shipment.id}"]`);if(!r)return;const v=document.createElement("div");v.innerHTML=I(i[p]);const u=v.firstElementChild;r.replaceWith(u),(h=u.querySelector(".track-btn"))==null||h.addEventListener("click",y=>{y.stopPropagation(),window.navigate(`#/tracking/${u.dataset.id}`)}),u.addEventListener("click",()=>window.navigate(`#/tracking/${u.dataset.id}`))});window.addEventListener("hashchange",d,{once:!0}),e()}const ie="modulepreload",ae=function(t){return"/"+t},z={},ne=function(i,e,o){let n=Promise.resolve();if(e&&e.length>0){document.getElementsByTagName("link");const s=document.querySelector("meta[property=csp-nonce]"),d=(s==null?void 0:s.nonce)||(s==null?void 0:s.getAttribute("nonce"));n=Promise.allSettled(e.map(l=>{if(l=ae(l),l in z)return;z[l]=!0;const p=l.endsWith(".css"),r=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${r}`))return;const v=document.createElement("link");if(v.rel=p?"stylesheet":ie,p||(v.as="script"),v.crossOrigin="",v.href=l,d&&v.setAttribute("nonce",d),document.head.appendChild(v),p)return new Promise((u,h)=>{v.addEventListener("load",u),v.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${l}`)))})}))}function a(s){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=s,window.dispatchEvent(d),!d.defaultPrevented)throw s}return n.then(s=>{for(const d of s||[])d.status==="rejected"&&a(d.reason);return i().catch(a)})};function se(t,i,e){const o=document.createElement("div");o.className="modal-backdrop",o.innerHTML=`
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">Update Shipment Status</div>
        <button class="btn btn-ghost btn-sm close-modal">✕</button>
      </div>
      <div class="modal-body">
        <form id="update-status-form">
          <div class="input-group" style="flex-direction:column;align-items:start;gap:6px;margin-bottom:12px">
            <label style="font-size:12px;color:var(--text-3);font-weight:600">New Status *</label>
            <select name="status" class="select" required style="width:100%">
              <option value="in_transit" ${i==="in_transit"?"selected":""}>In Transit</option>
              <option value="out_for_delivery" ${i==="out_for_delivery"?"selected":""}>Out for Delivery</option>
              <option value="delivered" ${i==="delivered"?"selected":""}>Delivered</option>
              <option value="delayed" ${i==="delayed"?"selected":""}>Delayed</option>
              <option value="awaiting_customs" ${i==="awaiting_customs"?"selected":""}>Awaiting Customs</option>
              <option value="exception" ${i==="exception"?"selected":""}>Exception</option>
            </select>
          </div>

          <div class="input-group" style="flex-direction:column;align-items:start;gap:6px;margin-bottom:12px">
            <label style="font-size:12px;color:var(--text-3);font-weight:600">Event Description</label>
            <input name="description" class="input" placeholder="e.g. Package arrived at local facility" style="width:100%" />
          </div>

          <div class="input-group" style="flex-direction:column;align-items:start;gap:6px;margin-bottom:20px">
            <label style="font-size:12px;color:var(--text-3);font-weight:600">Location</label>
            <input name="location" class="input" placeholder="e.g. New York, NY" style="width:100%" />
          </div>

          <div style="display:flex;justify-content:flex-end;gap:12px">
            <button type="button" class="btn btn-ghost close-modal">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-status">Update Status</button>
          </div>
        </form>
      </div>
    </div>
  `,document.body.appendChild(o);const n=()=>o.remove();o.querySelectorAll(".close-modal").forEach(s=>s.onclick=n);const a=o.querySelector("#update-status-form");a.onsubmit=async s=>{s.preventDefault();const d=new FormData(a),p={code:{in_transit:"IT",out_for_delivery:"OD",delivered:"DEL",delayed:"DLY",awaiting_customs:"AC",exception:"EX"}[d.get("status")]||"IT",description:d.get("description"),location:d.get("location")},r=a.querySelector("#btn-submit-status");r.disabled=!0,r.textContent="Updating...";try{await x.injectEvent(t,p),n(),e&&e()}catch(v){alert("Error updating status: "+v.message),r.disabled=!1,r.textContent="Update Status"}}}const D={in_transit:"In Transit",out_for_delivery:"Out for Delivery",delivered:"Delivered",delayed:"Delayed",awaiting_customs:"Awaiting Customs",exception:"Exception"},oe={in_transit:"🚚",out_for_delivery:"📬",delivered:"✅",delayed:"⚠️",awaiting_customs:"🛃",exception:"🚨"},le={in_transit:"🚚",out_for_delivery:"📬",delivered:"✅",delayed:"⚠️",awaiting_customs:"🛃",exception:"🚨"};function re(t){return new Date(t).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}function _(t){if(!t)return"—";const i=new Date(t),o=(i-new Date)/36e5;return o<0?"Past due":o<1?`~${Math.round(o*60)} min`:o<24?`~${Math.round(o*10)/10}h`:i.toLocaleDateString("en-US",{month:"short",day:"numeric"})}function B(t){return[...t].reverse().map((e,o)=>`
    <div class="timeline-item ${o===0?"timeline-latest":""}">
      <div class="timeline-dot ${e.status}">${le[e.status]||"📌"}</div>
      <div class="timeline-content">
        <div class="timeline-event">${e.description}</div>
        <div class="timeline-meta">${e.location} · ${re(e.timestamp)}</div>
      </div>
    </div>`).join("")}function O(t){return t?String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function de(t){return`${location.origin}${location.pathname}#/track/${t}`}async function F(t,i){var h,y;t.innerHTML='<div class="loading-overlay"><div class="spinner"></div><span>Loading tracking data…</span></div>';let e;try{e=await x.shipment(i)}catch(m){t.innerHTML=`<div class="loading-overlay"><span style="color:var(--clr-exception)">❌ ${m.message}</span></div>`;return}t.innerHTML=`
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:12px">
        <button class="btn btn-ghost btn-sm" onclick="window.navigate('#/shipments')">← Back</button>
        <div>
          <div class="page-title">${e.trackingNumber}</div>
          <div class="page-subtitle">${e.description} · ${e.carrierName||e.carrier}</div>
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        ${["shipper","ops"].includes(c==null?void 0:c.role)?'<button class="btn btn-secondary btn-sm" id="update-status-btn" title="Update status">✏️ Update Status</button>':""}
        <a class="btn btn-primary btn-sm" href="https://www.google.com/maps/search/?api=1&query=${e.currentPosition.lat},${e.currentPosition.lng}" target="_blank" title="View Current Location on Google Maps">🗺️ Open in Google Maps</a>
        <button class="btn btn-secondary btn-sm" id="share-btn" title="Copy shareable link">🔗 Share Track</button>
        <span class="status-badge ${e.status} pulsing"><span class="dot"></span>${D[e.status]}</span>
      </div>
    </div>

    <div class="tracking-layout">
      <!-- Map -->
      <div class="map-container">
        <div id="tracking-map"></div>
        <div class="map-overlay-card">
          <div style="font-size:12px;color:var(--text-3);font-weight:600;text-transform:uppercase;letter-spacing:.5px">Live Status</div>
          <div class="map-stat-row">
            <div class="map-stat">
              <div class="map-stat-val" id="map-eta">${_(e.estimatedDelivery)}</div>
              <div class="map-stat-lbl">ETA</div>
            </div>
            <div class="map-stat">
              <div class="map-stat-val" id="map-km">${e.remainingKm??"—"}</div>
              <div class="map-stat-lbl">km left</div>
            </div>
            <div class="map-stat">
              <div class="map-stat-val">${e.traffic||"N/A"}</div>
              <div class="map-stat-lbl">Traffic</div>
            </div>
            <div class="map-stat">
              <div class="map-stat-val">${e.weather||"N/A"}</div>
              <div class="map-stat-lbl">Weather</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Panel -->
      <div class="timeline-panel">
        <div class="timeline-header">
          <div style="font-weight:700;font-size:15px;margin-bottom:4px">Event Timeline</div>
          <div style="font-size:12px;color:var(--text-3)">${e.events.length} events recorded</div>
          <div style="margin-top:14px;padding:12px;background:var(--surface);border-radius:var(--radius);border:1px solid var(--border)">
            <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">ROUTE</div>
            <div style="font-size:13px;font-weight:500;display:flex;gap:8px;align-items:center">
              <span>${e.origin.name}</span>
              <span style="color:var(--text-3)">→</span>
              <span>${e.destination.name}</span>
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-top:6px">${e.service} · ${e.weight} · ${e.dimensions}</div>
          </div>
          ${e.customer?`
          <div style="margin-top:10px;padding:12px;background:var(--surface);border-radius:var(--radius);border:1px solid var(--border)">
            <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">CUSTOMER</div>
            <div style="font-size:13px;font-weight:500">${O(e.customer.name)}</div>
            <div style="font-size:12px;color:var(--text-3)">${O(e.customer.email)}</div>
          </div>
          `:""}
        </div>
        <div class="timeline-scroll">
          <div class="timeline" id="event-timeline">${B(e.events)}</div>
        </div>
      </div>
    </div>`,(h=document.getElementById("share-btn"))==null||h.addEventListener("click",()=>{const m=de(e.trackingNumber);navigator.clipboard.writeText(m).then(()=>{const w=document.getElementById("share-btn");w.textContent="✅ Copied!",setTimeout(()=>{w.innerHTML="🔗 Share Track"},2e3)})});const o=document.getElementById("update-status-btn");o&&o.addEventListener("click",()=>{se(i,e.status,()=>F(t,i))}),await ne(()=>import("https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js"),[]).catch(()=>null);const n=window.L;if(!n){console.error("Leaflet not loaded");return}const a=n.map("tracking-map",{center:[e.currentPosition.lat,e.currentPosition.lng],zoom:10,zoomControl:!0});if(n.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:"© OpenStreetMap © CARTO",subdomains:"abcd",maxZoom:19}).addTo(a),(y=e.routeWaypoints)!=null&&y.length){const m=e.routeWaypoints.map(k=>[k[0],k[1]]);n.polyline(m,{color:"#5b6ef5",weight:3,opacity:.6,dashArray:"8,6"}).addTo(a);const w=m.slice(0,(e.currentWaypointIndex||0)+1);w.length>1&&n.polyline(w,{color:"#5b6ef5",weight:4,opacity:.9}).addTo(a)}const s=n.divIcon({className:"",html:'<div style="background:#1e2535;border:2px solid #5b6ef5;border-radius:50%;width:14px;height:14px;box-shadow:0 0 8px rgba(91,110,245,0.5)"></div>',iconSize:[14,14],iconAnchor:[7,7]});n.marker([e.origin.lat,e.origin.lng],{icon:s}).bindPopup(`<strong>Origin</strong><br>${e.origin.name}`).addTo(a);const d=n.divIcon({className:"",html:'<div style="background:#10b981;border:2px solid #34d399;border-radius:50%;width:16px;height:16px;box-shadow:0 0 10px rgba(52,211,153,0.6)"></div>',iconSize:[16,16],iconAnchor:[8,8]});n.marker([e.destination.lat,e.destination.lng],{icon:d}).bindPopup(`<strong>Destination</strong><br>${e.destination.name}`).addTo(a),n.circle([e.destination.lat,e.destination.lng],{radius:8e3,color:"#10b981",fillColor:"#10b981",fillOpacity:.07,weight:1.5,dashArray:"6,4"}).addTo(a);const l=n.divIcon({className:"",html:`<div style="
      background:linear-gradient(135deg,#5b6ef5,#a78bfa);
      border-radius:50%;width:34px;height:34px;
      display:flex;align-items:center;justify-content:center;
      font-size:16px;box-shadow:0 0 0 6px rgba(91,110,245,0.25),0 4px 16px rgba(0,0,0,0.5);
      border:2px solid rgba(255,255,255,0.2)
    ">${oe[e.status]||"📦"}</div>`,iconSize:[34,34],iconAnchor:[17,17]});let p=n.marker([e.currentPosition.lat,e.currentPosition.lng],{icon:l}).bindPopup(`<strong>${e.trackingNumber}</strong><br>${D[e.status]||e.status}`).addTo(a).openPopup();const r=[{lat:e.currentPosition.lat+.15,lng:e.currentPosition.lng-.1,name:"Distribution Hub A"},{lat:e.currentPosition.lat-.1,lng:e.currentPosition.lng+.2,name:"Sorting Facility B"}],v=n.divIcon({className:"",html:'<div style="background:var(--bg-3,#1e2535);border:1px solid #374151;border-radius:6px;padding:4px 8px;font-size:10px;color:#9ca3af;white-space:nowrap">🏭</div>',iconSize:[null,null]});r.forEach(m=>n.marker([m.lat,m.lng],{icon:v}).bindPopup(m.name).addTo(a));const u=A(m=>{var w,k,P;if(!(((w=m.shipment)==null?void 0:w.id)!==i&&((k=m.shipment)==null?void 0:k.id)!==e.id)){if(m.type==="position_update"||m.type==="shipment_update"){const b=m.shipment;b.currentPosition&&(p.setLatLng([b.currentPosition.lat,b.currentPosition.lng]),a.panTo([b.currentPosition.lat,b.currentPosition.lng],{animate:!0,duration:1.5})),b.estimatedDelivery&&(document.getElementById("map-eta").textContent=_(b.estimatedDelivery)),b.remainingKm!==void 0&&(document.getElementById("map-km").textContent=b.remainingKm)}if(m.type==="shipment_update"&&((P=m.shipment)!=null&&P.events)){const b=document.getElementById("event-timeline");b&&(b.innerHTML=B(m.shipment.events))}}});window.addEventListener("hashchange",()=>{u(),a.remove()},{once:!0})}async function ce(){return window.Chart?window.Chart:new Promise((t,i)=>{const e=document.createElement("script");e.src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js",e.onload=()=>t(window.Chart),e.onerror=i,document.head.appendChild(e)})}const $="rgba(255,255,255,0.06)",E={responsive:!0,maintainAspectRatio:!1,plugins:{legend:{labels:{color:"#a0aec0",boxWidth:12}}}};async function pe(t){t.innerHTML=`
    <div class="page-header">
      <div>
        <div class="page-title">Analytics</div>
        <div class="page-subtitle">On-time performance, delay trends, and carrier SLA compliance</div>
      </div>
    </div>
    <div class="loading-overlay" id="analytics-loader"><div class="spinner"></div><span>Loading analytics…</span></div>
    <div id="analytics-content" style="display:none"></div>`;try{const[i,e,o,n]=await Promise.all([ce(),x.analyticsSummary(),x.carrierSla(),x.volume()]);i.defaults.color="#a0aec0",document.getElementById("analytics-loader").style.display="none";const a=document.getElementById("analytics-content");a.style.display="block",a.innerHTML=`
      <!-- KPI Stats -->
      <div class="stats-grid">
        <div class="stat-card animate-in">
          <span class="stat-icon">🎯</span>
          <div class="stat-label">On-Time Rate</div>
          <div class="stat-value" style="color:${e.otpRate>=90?"var(--clr-delivered)":"var(--clr-delayed)"}">${e.otpRate}%</div>
          <div class="stat-change">Target: 95%</div>
        </div>
        <div class="stat-card animate-in animate-in-delay-1">
          <span class="stat-icon">🚚</span>
          <div class="stat-label">Total Shipments</div>
          <div class="stat-value">${e.total}</div>
          <div class="stat-change">${e.inTransit} in transit</div>
        </div>
        <div class="stat-card animate-in animate-in-delay-2">
          <span class="stat-icon">⚠️</span>
          <div class="stat-label">Delayed</div>
          <div class="stat-value" style="color:var(--clr-delayed)">${e.delayed}</div>
          <div class="stat-change">Avg +${e.avgDelayMinutes}min delay</div>
        </div>
        <div class="stat-card animate-in animate-in-delay-3">
          <span class="stat-icon">🚨</span>
          <div class="stat-label">Exceptions</div>
          <div class="stat-value" style="color:var(--clr-exception)">${e.exceptions}</div>
          <div class="stat-change">${e.customs} in customs</div>
        </div>
      </div>

      <div class="analytics-grid">
        <!-- OTP Donut -->
        <div class="card animate-in">
          <div class="card-header"><div class="card-title">On-Time Performance (OTP)</div></div>
          <div class="chart-wrapper"><canvas id="otp-chart"></canvas></div>
        </div>

        <!-- Delay Causes -->
        <div class="card animate-in animate-in-delay-1">
          <div class="card-header"><div class="card-title">Top Delay Causes</div></div>
          <div class="chart-wrapper"><canvas id="delay-chart"></canvas></div>
        </div>

        <!-- Volume Trend -->
        <div class="card analytics-full animate-in animate-in-delay-2">
          <div class="card-header"><div class="card-title">Daily Volume — Last 14 Days</div></div>
          <div class="chart-wrapper" style="height:220px"><canvas id="volume-chart"></canvas></div>
        </div>

        <!-- Carrier SLA Table -->
        <div class="card analytics-full animate-in animate-in-delay-3">
          <div class="card-header"><div class="card-title">Carrier SLA Compliance</div></div>
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Carrier</th><th>Shipments</th><th>On Time</th>
                  <th>Delayed</th><th>SLA Target</th><th>Compliance</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${o.map(s=>`
                  <tr>
                    <td><strong>${s.logo} ${s.name}</strong></td>
                    <td>${s.total}</td>
                    <td style="color:var(--clr-delivered)">${s.onTime}</td>
                    <td style="color:var(--clr-delayed)">${s.delayed}</td>
                    <td>${s.slaTarget}%</td>
                    <td>
                      <div class="sla-bar-wrapper">
                        <div class="sla-bar">
                          <div class="sla-fill ${s.slaStatus}" style="width:${s.compliance}%"></div>
                        </div>
                        <span style="min-width:38px;font-weight:600;font-size:13px">${s.compliance}%</span>
                      </div>
                    </td>
                    <td>
                      <span class="status-badge ${s.slaStatus==="met"?"delivered":"exception"}">
                        <span class="dot"></span>${s.slaStatus==="met"?"Met":"Breached"}
                      </span>
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>`,new i(document.getElementById("otp-chart"),{type:"doughnut",data:{labels:["On Time","Delayed","Exception","Customs"],datasets:[{data:[e.onTime,e.delayed,e.exceptions,e.customs],backgroundColor:["#10b981","#fbbf24","#f87171","#a78bfa"],borderWidth:2,borderColor:"#0d1117"}]},options:{...E,cutout:"72%",plugins:{...E.plugins,legend:{position:"right",labels:{color:"#a0aec0",padding:16,boxWidth:12}}}}}),new i(document.getElementById("delay-chart"),{type:"bar",data:{labels:e.delayCauses.map(s=>s.cause),datasets:[{label:"Impact (%)",data:e.delayCauses.map(s=>s.percentage),backgroundColor:["#fbbf24","#a78bfa","#60a5fa","#f87171","#34d399"],borderRadius:8,borderSkipped:!1}]},options:{...E,indexAxis:"y",plugins:{...E.plugins,legend:{display:!1}},scales:{x:{grid:{color:$},ticks:{color:"#637085"}},y:{grid:{display:!1},ticks:{color:"#a0aec0"}}}}}),new i(document.getElementById("volume-chart"),{type:"line",data:{labels:n.map(s=>s.date.slice(5)),datasets:[{label:"Total",data:n.map(s=>s.shipments),borderColor:"#5b6ef5",backgroundColor:"rgba(91,110,245,0.1)",fill:!0,tension:.4,pointRadius:3},{label:"Delivered",data:n.map(s=>s.delivered),borderColor:"#10b981",backgroundColor:"rgba(16,185,129,0.08)",fill:!0,tension:.4,pointRadius:3},{label:"Delayed",data:n.map(s=>s.delayed),borderColor:"#fbbf24",tension:.4,pointRadius:3}]},options:{...E,scales:{x:{grid:{color:$},ticks:{color:"#637085"}},y:{grid:{color:$},ticks:{color:"#637085"}}}}})}catch(i){document.getElementById("analytics-loader").innerHTML=`<span style="color:var(--clr-exception)">❌ ${i.message}</span>`}}async function ve(t){t.innerHTML=`
    <div class="page-header">
      <div>
        <div class="page-title">Settings & Alerts</div>
        <div class="page-subtitle">Manage your account preferences, notification channels, and delivery instructions</div>
      </div>
    </div>
    <div style="padding: 0 20px 40px; display:flex; flex-direction:column; gap:24px; max-width:800px; margin:0 auto;">
      
      <!-- Account Settings Card -->
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg);">
          <h3 style="margin:0; font-size:15px; font-weight:600;">Account Defaults</h3>
        </div>
        <div style="padding:20px; display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; gap:16px;">
            <div class="input-group" style="flex:1; flex-direction:column; align-items:flex-start; gap:6px;">
              <label style="font-size:13px; font-weight:500; color:var(--text-2);">Timezone</label>
              <select class="select" style="width:100%">
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
            <div class="input-group" style="flex:1; flex-direction:column; align-items:flex-start; gap:6px;">
              <label style="font-size:13px; font-weight:500; color:var(--text-2);">Language Preference</label>
              <select class="select" style="width:100%">
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Preferences Card -->
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg);">
          <h3 style="margin:0; font-size:15px; font-weight:600;">Notification Channels</h3>
          <div style="font-size:12px; color:var(--text-3); margin-top:4px;">Choose how you want to be alerted.</div>
        </div>
        <div style="padding:20px; display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:500;">Email Alerts</div>
              <div style="font-size:12px; color:var(--text-3);">Receive shipment tracking updates via email.</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" checked />
              <span class="slider"></span>
            </label>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:500;">SMS Text Messages</div>
              <div style="font-size:12px; color:var(--text-3);">Standard carrier texting rates may apply.</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" checked />
              <span class="slider"></span>
            </label>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:500;">Push Notifications</div>
              <div style="font-size:12px; color:var(--text-3);">Get alerts delivered directly to your device screen.</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" />
              <span class="slider"></span>
            </label>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:16px; margin-top:8px;">
            <div>
              <div style="font-size:14px; font-weight:500;">Quiet Hours</div>
              <div style="font-size:12px; color:var(--text-3);">Silence non-urgent alerts between 10 PM and 7 AM.</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" checked />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Milestone Alerts Card -->
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg);">
          <h3 style="margin:0; font-size:15px; font-weight:600;">Milestone Alerts</h3>
          <div style="font-size:12px; color:var(--text-3); margin-top:4px;">Select which tracking events should trigger a notification.</div>
        </div>
        <div style="padding:20px; display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" checked class="checkbox-custom"/> Picked Up
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" checked class="checkbox-custom"/> Out for Delivery
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" checked class="checkbox-custom"/> Delivered
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" checked class="checkbox-custom"/> Exceptions (🚨 Critical)
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" checked class="checkbox-custom"/> Delayed
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" class="checkbox-custom"/> Customs Holds
          </label>
        </div>
      </div>

      <!-- Delivery Instructions -->
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg);">
          <h3 style="margin:0; font-size:15px; font-weight:600;">Default Delivery Instructions</h3>
        </div>
        <div style="padding:20px;">
          <div class="input-group" style="flex-direction:column; align-items:flex-start; gap:8px;">
            <label style="font-size:13px; font-weight:500; color:var(--text-2);">Where should carriers leave your packages?</label>
            <textarea class="input" style="width:100%; min-height:80px; resize:vertical; padding:12px;" placeholder="e.g. Please leave packages on the back porch behind the planter..."></textarea>
          </div>
          <div style="margin-top:16px; display:flex; align-items:center; gap:8px;">
            <input type="checkbox" id="gate-code" class="checkbox-custom"/>
            <label for="gate-code" style="font-size:14px; cursor:pointer;">My property has a gate code</label>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end;">
        <button class="btn btn-primary" style="padding:10px 24px; font-size:14px;" onclick="const btn=this; btn.textContent='Saving...'; setTimeout(() => { btn.textContent='Save Settings'; btn.style.background='var(--clr-delivered)'; setTimeout(()=> {btn.style.background='';}, 2000)}, 800)">Save Settings</button>
      </div>
    </div>
  `}async function me(t,i){t.innerHTML=`
    <div class="page-header">
      <div>
        <div class="page-title">Tracking: ${i}</div>
        <div class="page-subtitle">Public Tracking Page</div>
      </div>
    </div>
    <div class="loading-overlay" id="public-tracking-loader"><div class="spinner"></div><span>Loading tracking data…</span></div>
    <div id="public-tracking-content" style="display:none; padding: 20px;">
    </div>
  `;try{const e=await x.publicTrack(i);document.getElementById("public-tracking-loader").style.display="none";const o=document.getElementById("public-tracking-content");o.style.display="block",o.innerHTML=`
      <div class="card">
        <h3>Status: ${e.status.replace("_"," ").toUpperCase()}</h3>
        <p><strong>Description:</strong> ${e.description}</p>
        <p><strong>Carrier:</strong> ${e.carrier}</p>
        <p><strong>Origin:</strong> ${e.origin.name}</p>
        <p><strong>Destination:</strong> ${e.destination.name}</p>
        <p><strong>Estimated Delivery:</strong> ${new Date(e.estimatedDelivery).toLocaleDateString()}</p>
        
        <h4>Events</h4>
        <ul>
          ${e.events.map(n=>`<li>${new Date(n.timestamp).toLocaleString()} - ${n.location} - <strong>${n.description}</strong></li>`).join("")}
        </ul>
      </div>
    `}catch(e){document.getElementById("public-tracking-loader").innerHTML=`<span style="color:red">❌ ${e.message}</span>`}}async function ue(t){t.innerHTML='<div class="loading-overlay"><div class="spinner"></div><span>Loading profile…</span></div>';try{const i=await x.shipments({status:"delivered"}),e=c.name.split(" ").map(a=>a[0]).join("").slice(0,2).toUpperCase(),o=i.length===0?`<div class="empty-state" style="background:var(--surface); border:1px solid var(--border);">
          <div class="empty-icon">🛒</div>
          <div class="empty-title">No past orders found</div>
          <div class="empty-desc">When your shipments are delivered, they will appear here.</div>
        </div>`:`<div class="shipments-grid" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">
          ${i.map((a,s)=>I(a).replace('animate-in"',"animate-in animate-in-delay-"+Math.min(s,3)+'"')).join("")}
        </div>`;t.innerHTML=`
      <div class="page-header">
        <div>
          <div class="page-title">My Profile</div>
          <div class="page-subtitle">Manage your personal information and view your past order history</div>
        </div>
      </div>
      
      <div style="padding: 0 20px 40px; display:flex; flex-direction:column; gap:24px; max-width:900px; margin:0 auto;">
        
        <!-- Profile Info Cards Grid -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
          
          <!-- Personal Details -->
          <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;">
            <div style="padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg); display:flex; justify-content:space-between; align-items:center;">
              <h3 style="margin:0; font-size:15px; font-weight:600;">Personal Information</h3>
              <button class="btn btn-ghost btn-sm">Edit</button>
            </div>
            <div style="padding:20px; display:flex; flex-direction:column; gap:16px;">
              
              <div style="display:flex; align-items:center; gap:16px; margin-bottom:8px;">
                <div style="width:64px; height:64px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:700;">
                  ${e}
                </div>
                <div>
                  <div style="font-size:18px; font-weight:600;">${c.name}</div>
                  <div style="font-size:13px; color:var(--text-2); text-transform:capitalize;">${c.role} Account</div>
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:4px;">
                <div style="font-size:12px; color:var(--text-3); font-weight:600;">EMAIL ADDRESS</div>
                <div style="font-size:14px;">${c.email}</div>
              </div>
              <div style="display:flex; flex-direction:column; gap:4px;">
                <div style="font-size:12px; color:var(--text-3); font-weight:600;">PHONE NUMBER</div>
                <div style="font-size:14px;">+1 (555) 019-9283</div>
              </div>
            </div>
          </div>

          <!-- Address Book -->
          <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;">
            <div style="padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg); display:flex; justify-content:space-between; align-items:center;">
              <h3 style="margin:0; font-size:15px; font-weight:600;">Default Address</h3>
              <button class="btn btn-ghost btn-sm">Change</button>
            </div>
            <div style="padding:20px; display:flex; flex-direction:column; gap:16px; height:100%;">
              <div style="display:flex; gap:12px;">
                <div style="font-size:20px;">📍</div>
                <div>
                  <div style="font-weight:600; font-size:14px; margin-bottom:4px;">Home (Primary)</div>
                  <div style="font-size:14px; color:var(--text-2); line-height:1.5;">
                    1234 Silicon Valley Blvd<br/>
                    Suite 400<br/>
                    San Jose, CA 95131<br/>
                    United States
                  </div>
                </div>
              </div>
              
              <div style="margin-top:auto; padding-top:16px; border-top:1px solid var(--border);">
                <button class="btn btn-secondary btn-sm" style="width:100%">+ Add New Address</button>
              </div>
            </div>
          </div>

        </div>

        <!-- Past Orders Section -->
        <div>
          <h3 style="margin:0 0 16px 0; font-size:18px; font-weight:600; display:flex; align-items:center; gap:8px;">
            📦 Past Orders <span style="font-size:12px; font-weight:normal; background:var(--bg); padding:2px 8px; border-radius:12px; border:1px solid var(--border);">${i.length}</span>
          </h3>
          
          ${o}
        </div>

      </div>
    `;const n=t.querySelector(".shipments-grid");n&&(n.querySelectorAll(".track-btn").forEach(a=>{a.addEventListener("click",s=>{s.stopPropagation(),window.navigate(`#/tracking/${a.dataset.id}`)})}),n.querySelectorAll(".shipment-card").forEach(a=>{a.addEventListener("click",()=>window.navigate(`#/tracking/${a.dataset.id}`))}))}catch(i){t.innerHTML=`<div class="loading-overlay"><span style="color:var(--clr-exception)">❌ ${i.message}</span></div>`}}function ge(){const t=document.createElement("div");t.id="chatbot-container",t.innerHTML=`
    <!-- Floating Button -->
    <button id="chatbot-fab" class="chatbot-fab">
      <span class="chatbot-icon">💬</span>
    </button>

    <!-- Chat Window -->
    <div id="chatbot-window" class="chatbot-window hidden">
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="chat-avatar">AI</div>
          <div>
            <div class="chat-title">ShipTrack Assistant</div>
            <div class="chat-status"><span class="status-dot"></span> Online</div>
          </div>
        </div>
        <button id="chatbot-close" class="btn btn-ghost btn-sm" style="padding:4px; margin-right:-8px;">✖</button>
      </div>
      
      <div id="chat-messages" class="chat-messages">
        <div class="chat-bubble bot">
          Hi! I'm the ShipTrack AI assistant. You can ask me to track a package by pasting its tracking number (e.g., TRK-1234567).
        </div>
      </div>
      
      <div class="chat-input-area">
        <form id="chat-form" style="display:flex; width:100%; gap:8px;">
          <input type="text" id="chat-input" class="input chat-input" placeholder="Type a message..." autocomplete="off" />
          <button type="submit" class="btn btn-primary btn-icon chat-send">
            <span>➤</span>
          </button>
        </form>
      </div>
    </div>
  `,document.body.appendChild(t);const i=document.getElementById("chatbot-fab"),e=document.getElementById("chatbot-window"),o=document.getElementById("chatbot-close"),n=document.getElementById("chat-form"),a=document.getElementById("chat-input"),s=document.getElementById("chat-messages");let d=!1;function l(){d=!d,d?(e.classList.remove("hidden"),i.classList.add("active"),setTimeout(()=>a.focus(),100)):(e.classList.add("hidden"),i.classList.remove("active"))}i.addEventListener("click",l),o.addEventListener("click",l);function p(u,h=!1){const y=document.createElement("div");y.className=`chat-bubble ${h?"user":"bot"}`;const m=u.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>");y.innerHTML=m,s.appendChild(y),s.scrollTop=s.scrollHeight}function r(){const u=document.createElement("div");u.id="typing-indicator",u.className="chat-bubble bot typing",u.innerHTML='<span class="dot"></span><span class="dot"></span><span class="dot"></span>',s.appendChild(u),s.scrollTop=s.scrollHeight}function v(){const u=document.getElementById("typing-indicator");u&&u.remove()}n.addEventListener("submit",async u=>{u.preventDefault();const h=a.value.trim();if(h){p(h,!0),a.value="",r();try{const y=await x.chat(h);v(),p(y.reply||"I'm sorry, I didn't understand that.")}catch{v(),p("Unable to reach the server right now. Please try again later.")}}})}let c=null,f=null,N=null;const C=new Set;function he(t,i){c=t,localStorage.setItem("shiptrack_token",i),localStorage.setItem("shiptrack_user",JSON.stringify(t))}function G(){c=null,localStorage.removeItem("shiptrack_token"),localStorage.removeItem("shiptrack_user")}function ye(){try{const t=localStorage.getItem("shiptrack_user");t&&(c=JSON.parse(t))}catch{}}function A(t){return C.add(t),()=>C.delete(t)}function M(){if(!c||f&&f.readyState<2)return;const i=`${location.protocol==="https:"?"wss:":"ws:"}//${location.host}/ws?userId=${c.id}&role=${c.role}`;f=new WebSocket(i),f.onopen=()=>{var e;console.log("🔌 WebSocket connected"),(e=document.getElementById("ws-indicator"))==null||e.classList.add("connected"),clearTimeout(N)},f.onmessage=e=>{try{const o=JSON.parse(e.data);C.forEach(n=>n(o))}catch{}},f.onclose=()=>{var e;(e=document.getElementById("ws-indicator"))==null||e.classList.remove("connected"),N=setTimeout(M,3e3)},f.onerror=()=>f.close()}function H(){const t=document.getElementById("sidebar"),i=document.getElementById("mobile-nav"),e=document.getElementById("user-chip"),o=document.getElementById("main-content");if(!c){t.classList.add("hidden"),i&&i.classList.add("hidden"),o.classList.add("full-width");return}t.classList.remove("hidden"),i&&i.classList.remove("hidden"),o.classList.remove("full-width");const n=c.name.split(" ").map(l=>l[0]).join("").slice(0,2).toUpperCase();e.innerHTML=`
    <div class="user-avatar">${n}</div>
    <div class="user-info">
      <div class="user-name">${c.name}</div>
      <div class="user-role">${c.role}</div>
    </div>`;const a=document.querySelectorAll(".nav-ops"),s=document.querySelectorAll(".nav-shipper"),d=document.querySelectorAll(".nav-customer");a.forEach(l=>l.style.display=c.role==="ops"?"":"none"),s.forEach(l=>l.style.display=["ops","shipper"].includes(c.role)?"":"none"),d.forEach(l=>l.style.display=c.role==="customer"?"":"none")}function T(t){document.querySelectorAll(".nav-item").forEach(i=>{i.classList.toggle("active",i.dataset.page===t)})}async function S(){const t=location.hash||"#/",i=document.getElementById("app");if(t.startsWith("#/track/")){document.getElementById("sidebar").classList.add("hidden");const e=document.getElementById("mobile-nav");e&&e.classList.add("hidden"),document.getElementById("main-content").classList.add("full-width");const o=t.replace("#/track/","");i.innerHTML="",await me(i,o);return}if(!c){H(),i.innerHTML="",await J(i);return}if(H(),t==="#/"||t==="#/shipments")T("shipments"),i.innerHTML="",await te(i);else if(t.startsWith("#/tracking/")){T("shipments");const e=t.replace("#/tracking/","");i.innerHTML="",await F(i,e)}else if(t==="#/analytics"){if(!["ops","shipper"].includes(c.role)){location.hash="#/shipments";return}T("analytics"),i.innerHTML="",await pe(i)}else if(t==="#/notifications")T("notifications"),i.innerHTML="",await ve(i);else if(t==="#/profile"){if(c.role!=="customer"){location.hash="#/shipments";return}T("profile"),i.innerHTML="",await ue(i)}else location.hash="#/shipments"}ye();M();ge();window.addEventListener("hashchange",()=>S());const K=localStorage.getItem("shiptrack_theme")||"dark";document.documentElement.setAttribute("data-theme",K);var j;(j=document.getElementById("btn-theme"))==null||j.addEventListener("click",()=>{const i=document.documentElement.getAttribute("data-theme")==="light"?"dark":"light";document.documentElement.setAttribute("data-theme",i),localStorage.setItem("shiptrack_theme",i);const e=document.getElementById("btn-theme");e&&(e.innerHTML=i==="light"?"🌙 Dark Mode":"☀️ Light Mode")});const U=document.getElementById("btn-theme");U&&(U.innerHTML=K==="light"?"🌙 Dark Mode":"☀️ Light Mode");var q;(q=document.getElementById("btn-logout"))==null||q.addEventListener("click",()=>{G(),f&&f.close(),location.hash="#/",S()});var R;(R=document.getElementById("btn-logout-mobile"))==null||R.addEventListener("click",()=>{G(),f&&f.close(),location.hash="#/",S()});window.navigate=t=>{location.hash=t};window.getApp=()=>({currentUser:c,onWsMessage:A,connectWs:M});S();
