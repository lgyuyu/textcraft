var R=document.documentElement.style;
var themes={pink:{primary:"#e8457c",light:"#fff0f3",gradient:"linear-gradient(135deg,#e8457c,#ff8fab)",text:"#a01040"},blue:{primary:"#4f6df5",light:"#eef2ff",gradient:"linear-gradient(135deg,#4f6df5,#818cf8)",text:"#1e3a8a"},green:{primary:"#10b981",light:"#ecfdf5",gradient:"linear-gradient(135deg,#10b981,#34d399)",text:"#065f46"},orange:{primary:"#f97316",light:"#fff7ed",gradient:"linear-gradient(135deg,#f97316,#fb923c)",text:"#9a3412"},purple:{primary:"#8b5cf6",light:"#f5f3ff",gradient:"linear-gradient(135deg,#8b5cf6,#a78bfa)",text:"#5b21b6"},cyan:{primary:"#0ea5e9",light:"#f0f9ff",gradient:"linear-gradient(135deg,#0ea5e9,#38bdf8)",text:"#075985"}};
document.querySelectorAll(".style-btn").forEach(function(b){b.addEventListener("click",function(){document.querySelectorAll(".style-btn").forEach(function(x){x.classList.remove("active")});document.querySelectorAll(".content").forEach(function(x){x.classList.remove("active")});b.classList.add("active");var e=document.querySelector(".s"+b.dataset.s);if(e)e.classList.add("active")})});
document.querySelectorAll(".color-dot").forEach(function(d){d.addEventListener("click",function(){document.querySelectorAll(".color-dot").forEach(function(x){x.classList.remove("active")});d.classList.add("active");var t=themes[d.dataset.c];R.setProperty("--primary",t.primary);R.setProperty("--light",t.light);R.setProperty("--gradient",t.gradient);R.setProperty("--text",t.text)})});

function E(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
var emojis=['🎯','📅','⏰','💡','📌','🏆','💪','✨'];
function shape(i){var t=i%5,n=i+1;if(t===1)return '<div class="num" style="clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)">'+n+'</div>';if(t===2)return '<div class="num" style="clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%)">'+n+'</div>';if(t===3)return '<div class="num" style="border-radius:8px">'+n+'</div>';if(t===4)return '<div class="num" style="border-radius:10px">'+n+'</div>';return '<div class="num">'+n+'</div>'}
var AI_KEY='4e1068b3b7d8459ca481338876e58fdb.qS8Ml1qDJ0YkfAmU';
var AI_URL='https://open.bigmodel.cn/api/paas/v4/chat/completions';

var AI_KEY='4e1068b3b7d8459ca481338876e58fdb.qS8Ml1qDJ0YkfAmU';
var AI_URL='https://open.bigmodel.cn/api/paas/v4/chat/completions';

async function aiParse(text){
  var sys='你是一个文本结构化解析器。用户会给一段文字，你需要把它解析成JSON格式，用于生成精美信息图卡片。\n\n返回格式（严格JSON，不要任何其他内容）：\n{\n  "title": "主标题",\n  "subtitle": "一句话副标题描述",\n  "sections": [\n    {\n      "title": "板块标题",\n      "type": "text|table|phases|schedule|rules|stats",\n      "icon": "emoji",\n      "items": [\n        {"label": "短标签/时间", "detail": "详细描述", "value": "数值(可选)"}\n      ],\n      "stats": [{"num": "数字", "unit": "单位", "label": "标签"}]\n    }\n  ],\n  "stats": [{"num": "80万", "unit": "冲刺", "label": "总销售额"}]\n}\n\ntype说明：\n- text: 普通文本说明\n- table: 有对比数据（保底vs冲刺、指标对比等），items中每项有label和detail\n- phases: 分阶段计划（第1周、第01-30天等），items中label填阶段名，detail填内容\n- schedule: 时间安排（早读、下午、晚上等），items中label填时间，detail填动作\n- rules: 规则/铁律/注意事项/激励\n- stats: 统计数字\n\ntop-level stats数组（用于信息图的统计圆环），提取3-4个关键数字指标。\nsection.stats用于该板块自己的数据。\n\n重要：\n1. top-level stats数组必须提取3-4个关键数字指标（如金额、天数、百分比等），即使原文没有明确数字也要合理推算\n2. 每条信息独立成item，不要合并多条信息\n3. 有时间的信息，label填时间，detail填内容\n4. 有数值的信息，提取到value字段\n5. 给每个section选一个合适的emoji icon\n6. subtitle要精炼，不超过20字\n7. phases类型的section，label填阶段名（如"第01-30天"），detail填内容';
  var resp=await fetch(AI_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+AI_KEY},
    body:JSON.stringify({model:'glm-4-flash',messages:[{role:'system',content:sys},{role:'user',content:text}],max_tokens:2000,temperature:0.1})
  });
  var data=await resp.json();
  var msg=data.choices[0].message.content;
  // Parse JSON from response (may have markdown code block)
  var jsonMatch=msg.match(/\{[\s\S]*\}/);
  if(!jsonMatch)throw new Error('AI返回格式错误');
  var parsed=JSON.parse(jsonMatch[0]);
  // Normalize: ensure stats array at top level
  if(!parsed.stats)parsed.stats=[];
  // Normalize sections: ensure items have label/detail
  parsed.sections.forEach(function(s){
    if(!s.icon)s.icon='📌';
    if(!s.type)s.type='text';
    if(!s.items)s.items=[];
    s.items.forEach(function(item){
      if(!item.label)item.label='';
      if(!item.detail)item.detail='';
    });
  });
  return parsed;
}
// ===== parseText v3 =====
// Returns: {title, sections: [{title, items, type}]}
// type: 'text'|'table'|'phases'|'schedule'|'rules'
function parseText(text){
  var lines=text.split(String.fromCharCode(10)).map(function(l){return l.trim()}).filter(function(l){return l.length>0});
  if(!lines.length)return null;
  var data={title:lines[0],sections:[]};
  var curSec=null;
  var phaseParent=null; // when set, numbered lines become sub-items instead of new sections
  for(var i=1;i<lines.length;i++){
    var l=lines[i];var isH=false;
    var isNum=/^\d+[、.．)）]\s*/.test(l)&&l.length<25;
    if(/^【/.test(l)&&/】/.test(l)){isH=true;l=l.replace(/^【/,'').replace(/】$/,'')}
    else if(/：$/.test(l)&&l.length<25){isH=true;l=l.replace(/：$/,'')}
    else if(/^[一-十]+[、.]/.test(l)){isH=true}
    else if(isNum){
      // Numbered lines inside a phase parent → add as structured item
      if(phaseParent){
        var numLabel=l.replace(/^\d+[、.．)）]\s*/,'');
        // Create a structured item with label and collect subsequent items as details
        var subItems=[];
        while(i+1<lines.length){
          var next=lines[i+1];
          if(/^【/.test(next)||/：$/.test(next)&&next.length<25||/^[一-十]+[、.]/.test(next)||/^\d+[、.．)）]\s*/.test(next)&&next.length<25){
            break; // next line is a header
          }
          subItems.push(next);
          i++;
        }
        phaseParent.items.push({label:numLabel,detail:subItems.join('；')});
        continue;
      }
      // Otherwise check: if curSec has no items, this might be the start of a phase group
      if(curSec && curSec.items.length === 0){
        // Start phase mode: curSec becomes the parent, this line is its first item
        phaseParent = curSec;
        curSec.items.push(l);
        continue;
      }
      // Otherwise it's a normal new section header
      isH = true;
    }
    if(isH){
      // Non-numbered header ends phase grouping
      phaseParent = null;
      if(curSec)data.sections.push(curSec);
      curSec={title:l.replace(/^[一-十]+[、.]/,'').replace(/^\d+[、.．)）]\s*/,''),items:[],type:'text'};
    }else{
      if(!curSec)curSec={title:'内容',items:[],type:'text'};
      curSec.items.push(l);
    }
  }
  if(curSec)data.sections.push(curSec);
  // Auto-detect section type
  data.sections.forEach(function(s){
    var all=s.title+s.items.join('');
    if(/阶段|周|W\d|第\d+天|Phase/i.test(all))s.type='phases';
    else if(/时间|时段|:\d{1,2}|-:\d{1,2}|早读|下午|晚上|上午|晨会|复盘/i.test(all))s.type='schedule';
    else if(/铁律|规则|注意|风险|激励|惩罚|奖惩|誓/i.test(all))s.type='rules';
    else if(/指标|对比|保底|冲刺|目标/.test(all))s.type='table';
  });
  // If only 1 section with many items, split into chunks
  if(data.sections.length===1&&data.sections[0].items.length>6){
    var items=data.sections[0].items;data.sections=[];var chunk=[];
    for(var j=0;j<items.length;j++){
      chunk.push(items[j]);
      if(chunk.length>=3||j===items.length-1){
        var sec={title:chunk[0].substring(0,10),items:chunk,type:'text'};
        var all=sec.title+chunk.join('');
        if(/阶段|周|W\d|第\d+天/i.test(all))sec.type='phases';
        else if(/时间|时段|:\d{1,2}|早读|下午|晚上/i.test(all))sec.type='schedule';
        data.sections.push(sec);chunk=[];
      }
    }
  }
  // Auto-detect content type
  var longSections = data.sections.filter(function(s) { return s.items.length >= 3; }).length;
  var shortSections = data.sections.filter(function(s) { return s.items.length <= 2; }).length;
  if (data.sections.length <= 3 && longSections >= 2) {
    data.contentType = 'narrative';
  } else if (data.sections.length >= 5 && shortSections >= data.sections.length * 0.6) {
    data.contentType = 'bullet';
  } else {
    data.contentType = 'mixed';
  }
  return data;
}

// measureContent - 计算内容密度信息用于自适应渲染
function measureContent(data) {
  var secCount = data.sections.length;
  var totalChars = data.title.length + data.sections.reduce(function(a, s) {
    return a + s.title.length + s.items.reduce(function(b, item) {
      return b + (item.label || item).length + (item.detail || '').length;
    }, 0);
  }, 0);
  var maxTitleLen = Math.max.apply(null, data.sections.map(function(s) { return s.title.length; }).concat([0]));
  var avgItems = secCount > 0 ? data.sections.reduce(function(a, s) { return a + s.items.length; }, 0) / secCount : 0;
  var density = secCount <= 3 ? 'light' : secCount <= 6 ? 'normal' : 'dense';
  return {
    sectionCount: secCount,
    totalChars: totalChars,
    maxTitleLen: maxTitleLen,
    avgItems: avgItems,
    density: density
  };
}

// bS1 经典卡片 - AI版
function bS1(d, m){
  var titleSize = m.density === 'dense' ? '18px' : m.density === 'light' ? '26px' : '22px';
  var cardGap = m.density === 'dense' ? '8px' : m.density === 'light' ? '18px' : '14px';
  var itemFont = m.density === 'dense' ? '12px' : '13px';
  var heroPad = m.density === 'dense' ? '16px' : m.density === 'light' ? '32px' : '24px';
  var stitleSize = m.density === 'dense' ? '15px' : m.density === 'light' ? '19px' : '17px';
  var h='<div class="content active s1"><div class="hero" style="padding:'+heroPad+' 24px"><h1 style="font-size:'+titleSize+'">'+E(d.title)+'</h1>';
  if(d.subtitle)h+='<p>'+E(d.subtitle)+'</p>';
  h+='</div>';
  d.sections.forEach(function(s,i){
    h+='<div class="stitle" style="font-size:'+stitleSize+';margin:'+(m.density==='dense'?'16px':'24px')+' 0 '+(m.density==='dense'?'8px':'14px')+'">'+(s.icon||emojis[i%8])+' '+E(s.title)+'</div>';
    if(s.type==='phases'){
      var showItems = s.items;
      var maxItems = 4;
      if (showItems.length > maxItems) {
        showItems = showItems.slice(0, maxItems);
        showItems._truncated = true;
        showItems._totalCount = s.items.length;
      }
      showItems.forEach(function(t,j){
        h+='<div class="card" style="margin-bottom:'+cardGap+';padding:'+(m.density==='dense'?'12px':'18px')+'">'+shape(i)+'<div><h3 style="font-size:'+itemFont+'">'+E(t.label||'')+'</h3><p style="font-size:'+itemFont+'">'+E(t.detail||t.label||'')+'</p></div></div>';
      });
      if (showItems._truncated) {
        h += '<div style="font-size:12px;color:#444;margin-top:6px;padding-left:4px">...等' + showItems._totalCount + '条</div>';
      }
    }else if(s.type==='schedule'){
      h+='<div class="twrap"><table><thead><tr><th>时段</th><th>动作</th></tr></thead><tbody>';
      s.items.forEach(function(t){
        h+='<tr><td><b>'+E(t.label)+'</b></td><td>'+E(t.detail)+'</td></tr>';
      });
      h+='</tbody></table></div>';
    }else if(s.type==='table'){
      h+='<div class="cbox"><ul class="plist">';
      s.items.forEach(function(t){
        var txt=t.detail||t.label;
        if(t.value)txt=t.label+' '+t.value;
        h+='<li style="font-size:'+itemFont+'">'+E(txt)+'</li>';
      });
      h+='</ul></div>';
    }else if(s.type==='rules'){
      h+='<div class="cbox"><ul class="plist">';
      s.items.forEach(function(t){
        h+='<li style="font-size:'+itemFont+'">'+E(t.detail||t.label)+'</li>';
      });
      h+='</ul></div>';
    }else{
      var showItems = s.items;
      var maxItems = 4;
      if (showItems.length > maxItems) {
        showItems = showItems.slice(0, maxItems);
        showItems._truncated = true;
        showItems._totalCount = s.items.length;
      }
      showItems.forEach(function(t,j){
        h+='<div class="card" style="margin-bottom:'+cardGap+';padding:'+(m.density==='dense'?'12px':'18px')+'">'+shape(j)+'<div><p style="font-size:'+itemFont+'">'+(t.label?'<b>'+E(t.label)+'</b>：':'')+E(t.detail||t.label)+'</p></div></div>';
      });
      if (showItems._truncated) {
        h += '<div style="font-size:12px;color:#444;margin-top:6px;padding-left:4px">...等' + showItems._totalCount + '条</div>';
      }
    }
  });
  if(d.sections.length&&d.sections[d.sections.length-1].type==='rules'){}
  else if(d.stats&&d.stats.length){
    h+='<div class="dbox"><h4>🎯 '+E(d.title)+'</h4>';
    d.stats.forEach(function(st){h+='<p>'+E(st.num)+' '+E(st.unit)+' · '+E(st.label)+'</p>'});
    h+='</div>';
  }
  h+='</div>';
  return h;
}
// bS2 时间轴 - AI版
function bS2(d, m){
  var titleSize = m.density === 'dense' ? '18px' : m.density === 'light' ? '24px' : '22px';
  var secFont = m.density === 'dense' ? '12px' : '13px';
  var secGap = m.density === 'dense' ? '16px' : m.density === 'light' ? '28px' : '24px';
  var h='<div class="content s2"><div class="header"><h1 style="font-size:'+titleSize+'">'+E(d.title)+'</h1>';
  if(d.subtitle)h+='<p>'+E(d.subtitle)+'</p>';
  h+='</div>';
  d.sections.forEach(function(s,i){
    h+='<div class="sbox" style="margin-bottom:'+secGap+'"><h3>'+(s.icon||'📌')+' '+E(s.title)+'</h3>';
    var showItems = s.items;
    var maxItems = 4;
    if (s.type !== 'schedule' && showItems.length > maxItems) {
      showItems = showItems.slice(0, maxItems);
      showItems._truncated = true;
      showItems._totalCount = s.items.length;
    }
    showItems.forEach(function(t){
      if(t.label)h+='<p style="font-size:'+secFont+'"><b>'+E(t.label)+'</b> '+E(t.detail)+'</p>';
      else h+='<p style="font-size:'+secFont+'">'+E(t.detail||t.label)+'</p>';
    });
    if (showItems._truncated) {
      h += '<div style="font-size:12px;color:#444;margin-top:6px;padding-left:4px">...等' + showItems._totalCount + '条</div>';
    }
    h+='</div>';
  });
  h+='</div>';
  return h;
}

// bS3 大卡片 - AI版
function bS3(d, m){
  var titleSize = m.density === 'dense' ? '20px' : m.density === 'light' ? '28px' : '24px';
  var cardPad = m.density === 'dense' ? '14px' : m.density === 'light' ? '24px' : '20px';
  var cardGap = m.density === 'dense' ? '8px' : m.density === 'light' ? '18px' : '14px';
  var itemFont = m.density === 'dense' ? '12px' : '13px';
  var h='<div class="content s3"><div class="bighero"><span class="emoji">🚀</span><h1 style="font-size:'+titleSize+'">'+E(d.title)+'</h1>';
  if(d.subtitle)h+='<p>'+E(d.subtitle)+'</p>';
  h+='</div><div class="bcontent">';
  d.sections.forEach(function(s,i){
    h+='<div class="bc" style="padding:'+cardPad+';margin-bottom:'+cardGap+'"><div class="bc-icon">'+(s.icon||emojis[i%8])+'</div><div class="bc-body"><h3>'+E(s.title)+'</h3>';
    var showItems = s.items;
    var maxItems = 4;
    if (s.type !== 'schedule' && showItems.length > maxItems) {
      showItems = showItems.slice(0, maxItems);
      showItems._truncated = true;
      showItems._totalCount = s.items.length;
    }
    showItems.forEach(function(t){
      if(t.label)h+='<p style="font-size:'+itemFont+'"><b>'+E(t.label)+'</b> '+E(t.detail)+'</p>';
      else h+='<p style="font-size:'+itemFont+'">'+E(t.detail||t.label)+'</p>';
    });
    if (showItems._truncated) {
      h += '<div style="font-size:12px;color:#444;margin-top:6px;padding-left:4px">...等' + showItems._totalCount + '条</div>';
    }
    h+='</div></div>';
  });
  h+='</div></div>';
  return h;
}

// bS4 极简留白 - AI版
function bS4(d, m){
  var titleSize = m.density === 'dense' ? '22px' : m.density === 'light' ? '32px' : '28px';
  var padTB = m.density === 'dense' ? '32px' : m.density === 'light' ? '60px' : '48px';
  var padLR = m.density === 'dense' ? '28px' : m.density === 'light' ? '50px' : '44px';
  var secGap = m.density === 'dense' ? '28px' : m.density === 'light' ? '56px' : '48px';
  var itemFont = m.density === 'dense' ? '13px' : m.density === 'light' ? '15px' : '14px';
  var h='<div class="content s4" style="padding:'+padTB+' '+padLR+'"><div class="mintitle"><h1 style="font-size:'+titleSize+'">'+E(d.title)+'</h1>';
  if(d.subtitle)h+='<div class="sub">'+E(d.subtitle)+'</div>';
  h+='<div class="line"></div></div>';
  d.sections.forEach(function(s,i){
    h+='<div class="minsec" style="margin-bottom:'+secGap+'"><div class="minh">'+(s.icon||'')+' '+E(s.title)+'</div>';
    var showItems = s.items;
    var maxItems = 4;
    if (s.type !== 'schedule' && showItems.length > maxItems) {
      showItems = showItems.slice(0, maxItems);
      showItems._truncated = true;
      showItems._totalCount = s.items.length;
    }
    showItems.forEach(function(t){
      if(t.label)h+='<p style="font-size:'+itemFont+'"><b>'+E(t.label)+'</b> '+E(t.detail)+'</p>';
      else h+='<p style="font-size:'+itemFont+'">'+E(t.detail||t.label)+'</p>';
    });
    if (showItems._truncated) {
      h += '<div style="font-size:12px;color:#444;margin-top:6px;padding-left:4px">...等' + showItems._totalCount + '条</div>';
    }
    h+='</div>';
  });
  h+='</div>';
  return h;
}

// bS5 杂志风 - AI版
function bS5(d, m){
  var titleSize = m.density === 'dense' ? '22px' : m.density === 'light' ? '30px' : '26px';
  var itemFont = m.density === 'dense' ? '12px' : '13px';
  var secGap = m.density === 'dense' ? '18px' : m.density === 'light' ? '36px' : '28px';
  var bodyPad = m.density === 'dense' ? '18px' : m.density === 'light' ? '32px' : '28px';
  var h='<div class="content s5"><div class="mag-header"><h1 style="font-size:'+titleSize+'">'+E(d.title)+'</h1>';
  if(d.subtitle)h+='<p>'+E(d.subtitle)+'</p>';
  h+='<span class="side-text">TEXTCRAFT</span></div>';
  h+='<div class="mag-body" style="padding:'+bodyPad+'"><span class="side-deco">内容展示</span>';
  d.sections.forEach(function(s,i){
    h+='<div class="mag-sec" style="margin-bottom:'+secGap+'"><h3>'+(s.icon||'')+' '+E(s.title)+'</h3>';
    var showItems = s.items;
    var maxItems = 4;
    if (s.type !== 'schedule' && showItems.length > maxItems) {
      showItems = showItems.slice(0, maxItems);
      showItems._truncated = true;
      showItems._totalCount = s.items.length;
    }
    showItems.forEach(function(t){
      if(t.label)h+='<p style="font-size:'+itemFont+'">'+E(t.label)+' · '+E(t.detail)+'</p>';
      else h+='<p style="font-size:'+itemFont+'">'+E(t.detail||t.label)+'</p>';
    });
    if (showItems._truncated) {
      h += '<div style="font-size:12px;color:#444;margin-top:6px;padding-left:4px">...等' + showItems._totalCount + '条</div>';
    }
    h+='</div>';
  });
  h+='</div></div>';
  return h;
}

// bS6 笔记本 - AI版
function bS6(d, m){
  var titleSize = m.density === 'dense' ? '20px' : m.density === 'light' ? '24px' : '22px';
  var noteFontSize = m.density === 'dense' ? '13px' : m.density === 'light' ? '15px' : '14px';
  var noteLineH = Math.round(parseFloat(noteFontSize) * 2.3) + 'px';
  var h='<div class="content s6"><div class="note-header"><h1 style="font-size:'+titleSize+'">'+E(d.title)+'</h1>';
  if(d.subtitle)h+='<p>'+E(d.subtitle)+'</p>';
  h+='<div class="tape"></div><div class="tape-2"></div></div><div class="note-body">';
  d.sections.forEach(function(s,i){
    h+='<div class="note-sec">';
    h+='<h3><span class="step-num">'+(i+1)+'</span>'+E(s.title)+'</h3>';
    var showItems = s.items;
    var maxItems = 4;
    if (s.type !== 'schedule' && showItems.length > maxItems) {
      showItems = showItems.slice(0, maxItems);
      showItems._truncated = true;
      showItems._totalCount = s.items.length;
    }
    showItems.forEach(function(t){
      var text = t.detail || t.label || t;
      h+='<div class="item-line" style="font-size:'+noteFontSize+';line-height:'+noteLineH+'">'+E(text)+'</div>';
    });
    if (showItems._truncated) {
      h += '<div style="font-size:12px;color:#777;margin-top:4px;padding-left:30px">...等' + showItems._totalCount + '条</div>';
    }
    h+='</div>';
  });
  if(d.quote){
    h+='<div style="border-top:2px dashed var(--primary);padding-top:14px;margin-top:16px;font-size:13px;color:#444;line-height:1.8;text-align:center;font-style:italic">📌 '+E(d.quote)+'</div>';
  }
  h+='</div></div>';
  return h;
}

// bS8 网格布局 - AI版
function bS8(d, m){
  var titleSize = m.density === 'dense' ? '18px' : m.density === 'light' ? '22px' : '20px';
  var itemFont = m.density === 'dense' ? '11px' : '12px';
  var gridCols = m.density === 'dense' ? '1fr 1fr 1fr' : '1fr 1fr';
  var cardPad = m.density === 'dense' ? '12px' : '16px';
  var cardGap = m.density === 'dense' ? '8px' : '12px';
  var h='<div class="content s8"><div class="grid-hero"><h1 style="font-size:'+titleSize+'">'+E(d.title)+'</h1>';
  if(d.subtitle)h+='<p>'+E(d.subtitle)+'</p>';
  else h+='<p>'+d.sections.length+'个板块</p>';
  h+='</div><div class="grid" style="grid-template-columns:'+gridCols+';gap:'+cardGap+'">';
  d.sections.forEach(function(s,i){
    var full=s.items.length>2?' full':'';
    h+='<div class="gc'+full+'" style="padding:'+cardPad+'"><h3><span class="dot"></span>'+(s.icon||'')+' '+E(s.title)+'</h3>';
    var showItems = s.items;
    var maxItems = 4;
    if (s.type !== 'schedule' && s.type !== 'rules' && showItems.length > maxItems) {
      showItems = showItems.slice(0, maxItems);
      showItems._truncated = true;
      showItems._totalCount = s.items.length;
    }
    if(showItems.length>2){
      h+='<ul>';
      showItems.forEach(function(t){
        h+='<li style="font-size:'+itemFont+'">'+(t.label?'<b>'+E(t.label)+'</b>：':'')+E(t.detail||t.label)+'</li>';
      });
      h+='</ul>';
    }else{
      showItems.forEach(function(t){
        h+='<p style="font-size:'+itemFont+'">'+(t.label?'<b>'+E(t.label)+'</b>：':'')+E(t.detail||t.label)+'</p>';
      });
    }
    if (showItems._truncated) {
      h += '<div style="font-size:12px;color:#444;margin-top:6px;padding-left:4px">...等' + showItems._totalCount + '条</div>';
    }
    h+='</div>';
  });
  h+='</div></div>';
  return h;
}
// bS7 信息图 - AI版
function bS7(d, m){
  var titleSize = m.density === 'dense' ? '18px' : m.density === 'light' ? '24px' : '22px';
  var itemFont = m.density === 'dense' ? '12px' : '13px';
  var secGap = m.density === 'dense' ? '14px' : m.density === 'light' ? '24px' : '20px';
  // Determine if we should show ring charts (only when content has explicit phases/steps)
  var hasPhases = d.sections.some(function(s){ return s.type === 'phases'; });
  var showRings = hasPhases;
  var h='<div class="content s7"><div class="info-hero"><h1 style="font-size:'+titleSize+'">'+E(d.title)+'</h1>';
  if(d.subtitle)h+='<p>'+E(d.subtitle)+'</p>';
  // Stats circles from AI data - only show rings for steps/phases content
  if(showRings){
    if(d.stats&&d.stats.length>0){
      h+='<div class="stats">';
      d.stats.forEach(function(st,i){
        var pct=Math.min(95,Math.max(20,30+i*25));
        h+='<div class="stat-item"><div class="stat-circle" style="--pct:'+pct+'%"><div class="ring"></div><div class="ring-inner"></div><div class="inner"><span class="num">'+E(st.num)+'</span><span class="unit">'+E(st.unit)+'</span></div></div><div class="label">'+E(st.label)+'</div></div>';
      });
      h+='</div>';
    }else if(d.sections.length>0){
      h+='<div class="stats">';
      for(var i=0;i<Math.min(d.sections.length,4);i++){
        var pct=Math.min(95,25+i*20);
        var num=d.sections[i].items.length;
        h+='<div class="stat-item"><div class="stat-circle" style="--pct:'+pct+'%"><div class="ring"></div><div class="ring-inner"></div><div class="inner"><span class="num">'+num+'</span><span class="unit">项</span></div></div><div class="label">'+E(d.sections[i].title)+'</div></div>';
      }
      h+='</div>';
    }
  }
  h+='</div>';
  // Render sections
  d.sections.forEach(function(s,i){
    var icon=s.icon||emojis[i%8];
    if(s.type==='schedule'&&s.items.length>1){
      h+='<div class="ibox" style="margin-bottom:'+secGap+'"><h3>'+icon+' '+E(s.title)+'</h3>';
      s.items.forEach(function(t){
        h+='<div class="srow"><span class="badge">'+E(t.label)+'</span><span class="task" style="font-size:'+itemFont+'">'+E(t.detail)+'</span></div>';
      });
      h+='</div>';
    }else if(s.type==='phases'&&s.items.length>1&&showRings){
      var showItems7 = s.items;
      var maxItems7 = 4;
      if (showItems7.length > maxItems7) {
        showItems7 = showItems7.slice(0, maxItems7);
        showItems7._truncated = true;
        showItems7._totalCount = s.items.length;
      }
      h+='<div class="phases-row">';
      showItems7.forEach(function(t,j){
        var pct=Math.round(100/s.items.length);
        var lbl=t.label||('阶段'+(j+1));
        var dcText=t.detail?lbl+' · '+t.detail.substring(0,15):lbl;
        var isNum=/^\d+$/.test(dcText.trim().replace(/[^0-9]/g,''))&&dcText.length<=5;
        var dcClass=isNum?'dc':'dc is-text';
        h+='<div class="pbar"><div class="'+dcClass+'">'+E(dcText)+'</div><div class="dl">'+E(lbl)+'</div><div class="bar"><div class="bar-fill" style="width:'+pct+'%"></div></div></div>';
      });
      h+='</div>';
      if (showItems7._truncated) {
        h += '<div style="font-size:12px;color:#444;margin-top:6px;padding-left:4px">...等' + showItems7._totalCount + '条</div>';
      }
    }else if(s.type==='phases'&&s.items.length>1&&!showRings){
      var showItems7b = s.items;
      var maxItems7b = 4;
      if (showItems7b.length > maxItems7b) {
        showItems7b = showItems7b.slice(0, maxItems7b);
        showItems7b._truncated = true;
        showItems7b._totalCount = s.items.length;
      }
      h+='<div class="ibox" style="margin-bottom:'+secGap+'"><h3>'+icon+' '+E(s.title)+'</h3>';
      showItems7b.forEach(function(t,j){
        h+='<div class="srow"><span class="badge">'+(j+1)+'</span><span class="task" style="font-size:'+itemFont+'"><b>'+E(t.label||'')+'</b> '+E(t.detail||'')+'</span></div>';
      });
      if (showItems7b._truncated) {
        h += '<div style="font-size:12px;color:#444;margin-top:6px;padding-left:4px">...等' + showItems7b._totalCount + '条</div>';
      }
      h+='</div>';
    }else if(s.type==='rules'){
      h+='<div class="ibox" style="margin-bottom:'+secGap+'"><h3>'+icon+' '+E(s.title)+'</h3>';
      s.items.forEach(function(t,j){
        var w=Math.max(40,100-j*15);
        h+='<div class="pri-row"><div class="name" style="font-size:'+itemFont+'">'+E(t.detail||t.label)+'</div><div class="bar"><div class="bar-fill" style="width:'+w+'%"></div></div></div>';
      });
      h+='</div>';
    }else{
      var showItems7c = s.items;
      var maxItems7c = 4;
      if (showItems7c.length > maxItems7c) {
        showItems7c = showItems7c.slice(0, maxItems7c);
        showItems7c._truncated = true;
        showItems7c._totalCount = s.items.length;
      }
      h+='<div class="ibox" style="margin-bottom:'+secGap+'"><h3>'+icon+' '+E(s.title)+'</h3>';
      if(showItems7c.length>3){
        showItems7c.forEach(function(t){
          if(t.label&&t.detail){
            h+='<div class="srow"><span class="badge">'+E(t.label)+'</span><span class="task" style="font-size:'+itemFont+'">'+E(t.detail)+'</span></div>';
          }else{
            h+='<div class="srow"><span class="badge">▸</span><span class="task" style="font-size:'+itemFont+'">'+E(t.detail||t.label)+'</span></div>';
          }
        });
      }else{
        showItems7c.forEach(function(t){
          var txt=(t.label?'<b>'+E(t.label)+'</b>：':'')+E(t.detail||t.label);
          h+='<p style="font-size:'+itemFont+'">'+txt+'</p>';
        });
      }
      if (showItems7c._truncated) {
        h += '<div style="font-size:12px;color:#444;margin-top:6px;padding-left:4px">...等' + showItems7c._totalCount + '条</div>';
      }
      h+='</div>';
    }
  });
  // Bottom rules/iron law
  var ruleSec=d.sections.filter(function(s){return s.type==='rules'});
  if(ruleSec.length>0){
    h+='<div class="irules"><h4>'+(ruleSec[0].icon||'🔥')+' '+E(ruleSec[0].items[0]?ruleSec[0].items[0].detail:ruleSec[0].title)+'</h4></div>';
  }
  h+='</div>';
  return h;
}

// bS9 瀑布流 - AI版
function bS9(d, m){
  var titleSize = m.density === 'dense' ? '18px' : m.density === 'light' ? '22px' : '20px';
  var itemFont = m.density === 'dense' ? '11px' : '12px';
  var cardPad = m.density === 'dense' ? '12px' : '14px';
  var cols = '2';
  var colGap = m.density === 'dense' ? '10px' : '14px';
  var h='<div class="content s9"><div class="waterfall-header"><h1 style="font-size:'+titleSize+'">'+E(d.title)+'</h1>';
  if(d.subtitle)h+='<p style="color:#666">'+E(d.subtitle)+'</p>';
  h+='</div><div style="column-count:'+cols+';column-gap:'+colGap+';padding:0 14px 16px">';
  d.sections.forEach(function(s,i){
    var icon=s.icon||emojis[i%8];
    if(s.type==='rules'){
      h+='<div class="wf-card rules-card" style="column-span:all; padding:16px"><h3>'+icon+' '+E(s.title)+'</h3><p>';
      s.items.forEach(function(t){h+=E(t.detail||t.label)+'<br>'});
      h+='</p></div>';
      return;
    }
    var showItems = s.items;
    var maxItems = 4;
    if(s.type!=='schedule' && showItems.length>maxItems){
      showItems=showItems.slice(0,maxItems);
      showItems._truncated=true;
      showItems._totalCount=s.items.length;
    }
    h+='<div class="wf-card" style="padding:'+cardPad+'"><h3>'+icon+' '+E(s.title)+'</h3>';
    if(s.type==='schedule'&&showItems.length>0){
      showItems.forEach(function(t){
        h+='<p style="font-size:'+itemFont+'"><b style="color:var(--primary)">'+E(t.label)+'</b> '+E(t.detail)+'</p>';
      });
    }else{
      if(showItems.length>2){
        h+='<ul>';
        showItems.forEach(function(t){
          h+='<li style="font-size:'+itemFont+'">'+(t.label?'<b>'+E(t.label)+'</b>：':'')+E(t.detail||t.label)+'</li>';
        });
        h+='</ul>';
      }else{
        showItems.forEach(function(t){
          h+='<p style="font-size:'+itemFont+'">'+(t.label?'<b>'+E(t.label)+'</b>：':'')+E(t.detail||t.label)+'</p>';
        });
      }
    }
    if(showItems._truncated){
      h+='<div style="font-size:11px;color:#888;margin-top:6px">...等'+showItems._totalCount+'条</div>';
    }
    h+='</div>';
  });
  h+='</div></div>';
  return h;
}

// bS10 时间线日志 - AI版
function bS10(d, m){
  var titleSize = m.density === 'dense' ? '18px' : m.density === 'light' ? '22px' : '20px';
  var itemFont = m.density === 'dense' ? '12px' : '13px';
  var secFont = m.density === 'dense' ? '13px' : '15px';
  var entryGap = m.density === 'dense' ? '14px' : '20px';
  var h='<div class="content s10"><div class="log-banner"><h1 style="font-size:'+titleSize+'">'+E(d.title)+'</h1>';
  if(d.subtitle)h+='<p style="color:#666">'+E(d.subtitle)+'</p>';
  h+='</div><div class="log-timeline">';
  d.sections.forEach(function(s,i){
    var icon=s.icon||emojis[i%8];
    var isLast=i===d.sections.length-1;
    if(s.type==='rules'){
      h+='<div class="log-footer"><h4>'+icon+' '+E(s.title)+'</h4>';
      s.items.forEach(function(t){h+='<p>'+E(t.detail||t.label)+'</p>'});
      h+='</div>';
      return;
    }
    var showItems = s.items;
    var maxItems = 4;
    if(s.type!=='schedule' && showItems.length>maxItems){
      showItems=showItems.slice(0,maxItems);
      showItems._truncated=true;
      showItems._totalCount=s.items.length;
    }
    h+='<div class="log-entry" style="padding-bottom:'+(isLast?'0':entryGap)+'"><h3 style="font-size:'+secFont+'">'+icon+' '+E(s.title)+'</h3>';
    if(s.type==='schedule'){
      showItems.forEach(function(t){
        h+='<p style="font-size:'+itemFont+'"><span class="log-time">'+E(t.label)+'</span>'+E(t.detail)+'</p>';
      });
    }else{
      showItems.forEach(function(t){
        var text=(t.label?'<b>'+E(t.label)+'</b>：':'')+E(t.detail||t.label);
        h+='<p style="font-size:'+itemFont+'">● '+text+'</p>';
      });
    }
    if(showItems._truncated){
      h+='<div style="font-size:12px;color:#888;margin-top:4px">...等'+showItems._totalCount+'条</div>';
    }
    h+='</div>';
  });
  h+='</div></div>';
  return h;
}

// bS11 数据仪表盘 - AI版
function bS11(d, m){
  var titleSize = m.density === 'dense' ? '18px' : m.density === 'light' ? '22px' : '20px';
  var itemFont = m.density === 'dense' ? '11px' : '12px';
  var cardPad = m.density === 'dense' ? '12px' : '16px';
  var cardGap = m.density === 'dense' ? '8px' : '12px';
  var totalItems=d.sections.reduce(function(a,s){return a+s.items.length},0);
  var h='<div class="content s11"><div class="dash-header"><h1 style="font-size:'+titleSize+'">'+E(d.title)+'</h1>';
  if(d.subtitle)h+='<p>'+E(d.subtitle)+'</p>';
  else h+='<p>'+d.sections.length+'个板块 · '+totalItems+'项任务</p>';
  h+='</div><div class="dash-stats">';
  var statNums=[d.sections.length,totalItems,Math.min(95,Math.round(totalItems/d.sections.length*15))+'%'];
  var statLabels=['板块总数','任务总计','达成率'];
  if(d.stats&&d.stats.length>=2){
    for(var si=0;si<3;si++){
      var st=d.stats[si]||{num:statNums[si],unit:'',label:statLabels[si]};
      h+='<div class="dash-stat"><div class="num">'+E(st.num)+'</div><div class="label">'+E(st.unit?(st.num+' '+st.unit):st.label)+'</div></div>';
    }
  }else{
    for(var si2=0;si2<3;si2++){
      h+='<div class="dash-stat"><div class="num">'+statNums[si2]+'</div><div class="label">'+statLabels[si2]+'</div></div>';
    }
  }
  h+='</div><div class="dash-cards">';
  d.sections.forEach(function(s,i){
    var icon=s.icon||emojis[i%8];
    if(s.type==='rules'){
      h+='<div class="dash-card rules-card" style="padding:'+cardPad+'"><h3>'+icon+' '+E(s.title)+'</h3>';
      s.items.forEach(function(t){h+='<p>'+E(t.detail||t.label)+'</p>'});
      h+='</div>';
      return;
    }
    var showItems=s.items;
    var maxItems=4;
    if(s.type!=='schedule'&&showItems.length>maxItems){
      showItems=showItems.slice(0,maxItems);
      showItems._truncated=true;
      showItems._totalCount=s.items.length;
    }
    h+='<div class="dash-card" style="padding:'+cardPad+';margin-bottom:'+cardGap+'"><h3>'+icon+' '+E(s.title)+'</h3>';
    if(s.type==='schedule'){
      showItems.forEach(function(t){
        h+='<div class="dash-row"><div class="row-label" style="font-size:'+itemFont+'">'+E(t.label)+'</div><div class="row-bar"><div class="row-fill" style="width:'+(40+Math.floor(Math.random()*50))+'%"></div></div></div>';
      });
    }else{
      showItems.forEach(function(t,j){
        var w=Math.max(25,95-j*18-Math.floor(Math.random()*10));
        var detail=t.detail&&t.label?t.label:(t.detail||t.label||'');
        h+='<div class="dash-row"><div class="row-label" style="font-size:'+itemFont+'">'+E(detail)+'</div><div class="row-bar"><div class="row-fill" style="width:'+w+'%"></div></div></div>';
      });
    }
    if(showItems._truncated){
      h+='<div style="font-size:11px;color:#888;margin-top:6px">...等'+showItems._totalCount+'条</div>';
    }
    h+='</div>';
  });
  h+='</div></div>';
  return h;
}

// bS12 手绘涂鸦风 - AI版
function bS12(d, m){
  var titleSize = m.density === 'dense' ? '18px' : m.density === 'light' ? '24px' : '22px';
  var itemFont = m.density === 'dense' ? '12px' : '13px';
  var secFont = m.density === 'dense' ? '13px' : '15px';
  var secGap = m.density === 'dense' ? '10px' : '14px';
  var wrapPad = m.density === 'dense' ? '18px 16px' : '28px 22px';
  var h='<div class="content s12"><div class="doodle-wrap" style="padding:'+wrapPad+'">';
  h+='<h1 style="font-size:'+titleSize+'">✦ '+E(d.title)+' ✦</h1>';
  if(d.subtitle)h+='<p style="text-align:center;font-size:13px;color:#888;margin-bottom:16px;font-style:italic">'+E(d.subtitle)+'</p>';
  var doodleStars=['★','✦','◆','✧','☆'];
  d.sections.forEach(function(s,i){
    var icon=s.icon||doodleStars[i%5];
    var isLast=i===d.sections.length-1;
    if(s.type==='rules'){
      h+='<div class="doodle-footer" style="margin-top:'+(m.density==='dense'?'12px':'16px')+'">★ '+E(s.title)+'：'+E(s.items[0]?s.items[0].detail||s.items[0].label:'')+'</div>';
      return;
    }
    var showItems=s.items;
    var maxItems=4;
    if(s.type!=='schedule'&&showItems.length>maxItems){
      showItems=showItems.slice(0,maxItems);
      showItems._truncated=true;
      showItems._totalCount=s.items.length;
    }
    h+='<div class="doodle-sec" style="padding-bottom:'+secGap+';margin-bottom:'+secGap+';'+(isLast?'border-bottom:none;margin-bottom:0':'')+'">';
    h+='<h3 style="font-size:'+secFont+'">'+icon+' '+E(s.title)+'</h3>';
    if(s.type==='schedule'){
      showItems.forEach(function(t){
        h+='<p style="font-size:'+itemFont+'">⏰ <b>'+E(t.label)+'</b> '+E(t.detail)+'</p>';
      });
    }else{
      if(showItems.length>1){
        h+='<ul>';
        showItems.forEach(function(t){
          var txt=t.detail||t.label||t;
          if(t.label&&t.detail)txt=t.label+' · '+t.detail;
          h+='<li style="font-size:'+itemFont+'">'+E(txt)+'</li>';
        });
        h+='</ul>';
      }else{
        showItems.forEach(function(t){
          h+='<p style="font-size:'+itemFont+'">□ '+E(t.detail||t.label)+'</p>';
        });
      }
    }
    if(showItems._truncated){
      h+='<div style="font-size:11px;color:#999;margin-top:6px">...等'+showItems._totalCount+'条</div>';
    }
    h+='</div>';
  });
  h+='<div class="doodle-sticky">💡<br>重点<br>标记！</div>';
  h+='</div></div>';
  return h;
}

// bS13 思维导图 - AI版
function bS13(d, m){
  var colors=['#e8457c','#6366f1','#10b981','#f59e0b','#ec4899','#0891b2'];
  var titleSize = m.density === 'dense' ? '18px' : m.density === 'light' ? '24px' : '22px';
  var rootSize = m.density === 'dense' ? '16px' : m.density === 'light' ? '20px' : '18px';
  var itemFont = m.density === 'dense' ? '12px' : '13px';
  var nodeTitleSize = m.density === 'dense' ? '13px' : '14px';
  var secGap = m.density === 'dense' ? '10px' : '16px';
  var maxMargin = m.density === 'dense' ? 100 : 140;
  var minMargin = m.density === 'dense' ? 20 : 60;
  var h='<div class="content s13"><div class="mm-header"><h1 style="font-size:'+titleSize+'">'+E(d.title)+'</h1>';
  if(d.subtitle)h+='<p>'+E(d.subtitle)+'</p>';
  h+='</div>';
  h+='<div class="mm-root"><h2 style="font-size:'+rootSize+'">🧠 '+E(d.title)+'</h2></div>';
  var secCount=d.sections.length;
  d.sections.forEach(function(s,i){
    var color=colors[i%colors.length];
    var marginLeft=Math.round(maxMargin-(maxMargin-minMargin)*(i/(Math.max(secCount-1,1))));
    var isLast=i===d.sections.length-1;
    var showItems=s.items;
    var maxItems=4;
    if(s.type!=='schedule'&&showItems.length>maxItems){
      showItems=showItems.slice(0,maxItems);
      showItems._truncated=true;
      showItems._totalCount=s.items.length;
    }
    h+='<div class="mm-branch" style="border-left-color:'+color+';margin-left:'+marginLeft+'px">';
    h+='<div class="mm-node" style="border-left:4px solid '+color+';margin-bottom:'+(isLast?'0':secGap)+'px">';
    h+='<h3 style="color:'+color+';font-size:'+nodeTitleSize+'">● '+E(s.title)+'</h3>';
    if(s.type==='phases'&&showItems.length>0){
      showItems.forEach(function(t,j){
        h+='<div style="margin-bottom:'+(j<showItems.length-1?'8px':'0')+';padding-left:12px">';
        if(t.label)h+='<div style="font-weight:700;font-size:'+itemFont+';color:#333;margin-bottom:2px">▸ '+E(t.label)+'</div>';
        if(t.detail)h+='<div style="font-size:'+itemFont+';color:#666;line-height:1.7;padding-left:8px">'+E(t.detail)+'</div>';
        h+='</div>';
      });
    }else if(s.type==='schedule'&&showItems.length>0){
      showItems.forEach(function(t){
        h+='<div class="mm-schedule"><div class="mm-sched-item"><span class="mm-sched-time" style="color:'+color+'">'+E(t.label)+'</span><span class="mm-sched-act">'+E(t.detail)+'</span></div></div>';
      });
    }else{
      h+='<p style="font-size:'+itemFont+';color:#555;line-height:1.7">';
      showItems.forEach(function(t){
        var txt=t.detail||t.label||t;
        if(t.label&&t.detail)txt=t.label+'：'+t.detail;
        h+='▸ '+E(txt)+'<br>';
      });
      h+='</p>';
    }
    if(showItems._truncated){
      h+='<div style="font-size:11px;color:#999;margin-top:6px">...等'+showItems._totalCount+'条</div>';
    }
    h+='</div></div>';
  });
  h+='</div>';
  return h;
}

// bS14 暗色模式 - AI版
function bS14(d, m){
  var glowColors=['rgba(232,69,124,.3)','rgba(99,102,241,.3)','rgba(16,185,129,.3)','rgba(245,158,11,.3)','rgba(236,72,153,.3)','rgba(8,145,178,.3)'];
  var lineColors=[
    'linear-gradient(90deg,#e8457c,#6366f1)',
    'linear-gradient(90deg,#6366f1,#10b981)',
    'linear-gradient(90deg,#10b981,#f59e0b)',
    'linear-gradient(90deg,#f59e0b,#ec4899)',
    'linear-gradient(90deg,#ec4899,#0891b2)',
    'linear-gradient(90deg,#0891b2,#e8457c)'
  ];
  var titleSize = m.density === 'dense' ? '20px' : m.density === 'light' ? '28px' : '24px';
  var itemFont = m.density === 'dense' ? '12px' : '13px';
  var cardTitleSize = m.density === 'dense' ? '14px' : '15px';
  var cardPad = m.density === 'dense' ? '14px 16px' : '18px 20px';
  var cardGap = m.density === 'dense' ? '10px' : '14px';
  var heroPad = m.density === 'dense' ? '20px' : '28px';
  var bodyPad = m.density === 'dense' ? '14px' : '20px';
  var accentColors=['#e8457c','#6366f1','#10b981','#f59e0b','#ec4899','#0891b2'];
  var h='<div class="content s14"><div class="dark-hero" style="padding:'+heroPad+'">';
  h+='<div class="glow-tr"></div><div class="glow-bl"></div>';
  h+='<h1 style="font-size:'+titleSize+'">'+E(d.title)+'</h1>';
  if(d.subtitle)h+='<p>'+E(d.subtitle)+'</p>';
  h+='</div><div class="dark-body" style="padding:'+bodyPad+'">';
  d.sections.forEach(function(s,i){
    var color=accentColors[i%accentColors.length];
    var glow=glowColors[i%glowColors.length];
    var line=lineColors[i%lineColors.length];
    var isLast=i===d.sections.length-1;
    if(s.type==='rules'){
      h+='<div class="dark-card" style="margin-bottom:0;background:linear-gradient(135deg,#2d2d5e,#1a1a3e);border-color:#444466"><div class="top-line" style="background:'+line+'"></div>';
      h+='<h3 style="font-size:'+cardTitleSize+';border-left-color:'+color+';text-shadow:0 0 10px '+glow+'">'+E(s.title)+'</h3>';
      h+='<p>';
      s.items.forEach(function(t){h+='▸ '+E(t.detail||t.label)+'<br>'});
      h+='</p></div>';
      return;
    }
    var showItems=s.items;
    var maxItems=4;
    if(s.type!=='schedule'&&showItems.length>maxItems){
      showItems=showItems.slice(0,maxItems);
      showItems._truncated=true;
      showItems._totalCount=s.items.length;
    }
    h+='<div class="dark-card" style="margin-bottom:'+(isLast?'0':cardGap)+'px;padding:'+cardPad+'"><div class="top-line" style="background:'+line+'"></div>';
    h+='<h3 style="font-size:'+cardTitleSize+';border-left-color:'+color+';text-shadow:0 0 10px '+glow+'">'+E(s.title)+'</h3>';
    if(s.type==='schedule'){
      showItems.forEach(function(t){
        h+='<p style="font-size:'+itemFont+'"><span style="color:'+color+';font-weight:600">'+E(t.label)+'</span>  '+E(t.detail)+'</p>';
      });
    }else{
      h+='<p style="font-size:'+itemFont+';color:#c8c8d4;line-height:1.8;padding-left:13px">';
      showItems.forEach(function(t){
        var txt=t.detail||t.label||t;
        if(t.label&&t.detail)txt=t.label+'  '+t.detail;
        h+='▸ '+E(txt)+'<br>';
      });
      h+='</p>';
    }
    if(showItems._truncated){
      h+='<div style="font-size:11px;color:#666688;margin-top:6px;padding-left:13px">...等'+showItems._totalCount+'条</div>';
    }
    h+='</div>';
  });
  h+='</div></div>';
  return h;
}

var _genAborted=false;
function cancelGenerate(){
  _genAborted=true;
  var gs=document.getElementById("genStatus");
  var gc=document.getElementById("genCancel");
  var gb=document.getElementById("genBtn");
  if(gs)gs.style.display="none";
  if(gc)gc.style.display="none";
  if(gb)gb.disabled=false;
}

async function generate(){
  var text=document.getElementById("inputText").value.trim();
  if(!text){alert("请先粘贴内容");return}
  var info=document.getElementById("exportInfo");
  var gs=document.getElementById("genStatus");
  var gb=document.getElementById("genBtn");
  var gc=document.getElementById("genCancel");
  _genAborted=false;
  if(gs){gs.style.display="inline-flex";gs.className="show"}
  if(gc)gc.style.display="inline-block";
  if(gb){gb.disabled=true}
  info.textContent="⚡ 生成中...";
  var d=null;
  try{d=await aiParse(text)}
  catch(e){console.log('AI解析失败，使用本地解析:',e);d=parseText(text)}
  if(_genAborted)return;
  if(!d||!d.sections.length){if(gs)gs.style.display="none";if(gc)gc.style.display="none";if(gb)gb.disabled=false;alert("未识别到内容结构");return}
  if(!d.subtitle)d.subtitle='';
  var m=measureContent(d);
  d.sections.forEach(function(s){
    if(!s.icon)s.icon='📌';
    if(!s.type)s.type='text';
    if(s.items&&s.items.length&&typeof s.items[0]==='string'){
      s.items=s.items.map(function(t){return{label:'',detail:t,value:''}});
    }
  });
  var area=document.getElementById("contentArea");
  area.innerHTML=bS1(d,m)+bS2(d,m)+bS3(d,m)+bS4(d,m)+bS5(d,m)+bS6(d,m)+bS7(d,m)+bS8(d,m)+bS9(d,m)+bS10(d,m)+bS11(d,m)+bS12(d,m)+bS13(d,m)+bS14(d,m);
  document.querySelectorAll(".style-btn").forEach(function(x){x.classList.remove("active")});
  document.querySelectorAll(".content").forEach(function(x){x.classList.remove("active")});
  document.querySelector('.style-btn[data-s="1"]').classList.add("active");
  area.querySelector(".s1").classList.add("active");
  if(gs)gs.style.display="none";if(gc)gc.style.display="none";if(gb)gb.disabled=false;
  info.textContent="✅ 已生成"+d.sections.length+"个板块的14种精美排版 (AI驱动)";
}
function exportCurrent(){var el=document.querySelector(".content.active");if(!el){alert("请先展示内容");return}html2canvas(el,{scale:2,backgroundColor:"#f5f5f5",width:800}).then(function(c){var a=document.createElement("a");a.download="排版-当前风格.png";a.href=c.toDataURL("image/png");a.click()})}
function exportAll(){var ns=["经典卡片","时间轴","大卡片","极简留白","杂志风","笔记本","信息图","网格布局","瀑布流","日志","仪表盘","涂鸦","思维导图","暗色模式"],cs=document.querySelectorAll(".content"),idx=0;function next(){if(idx>=cs.length)return;document.querySelectorAll(".content").forEach(function(x){x.classList.remove("active")});cs[idx].classList.add("active");setTimeout(function(){var bg=idx===13?"#1a1a2e":"#f5f5f5";html2canvas(cs[idx],{scale:2,backgroundColor:bg,width:800}).then(function(c){var a=document.createElement("a");a.download="排版-"+ns[idx]+".png";a.href=c.toDataURL("image/png");a.click();cs[idx].classList.remove("active");idx++;next()})},300)}next()}

