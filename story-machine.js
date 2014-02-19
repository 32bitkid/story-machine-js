var storyMachine = (function() {
  
  var requestFrame = (function(){
    return  window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      fallback;
    
    function fallback(callback) {
        window.setTimeout(callback, 1000 / 60);
    }
  })();
  
  // Animator
  var mator = (function() {
    var requestFrame = (function() {
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              fallback();
      
      function fallback() {
        var start = +new Date()
        return function fallbackAnimationFrame(callback) {
          window.setTimeout(function() {
            callback.call(this, (+new Date()) - start);
          }, 1000 / 60);
        };
      }
    })();
    
    // Animate
    var fn = function(total, easing) {
      easing = easing || fn.easing.linear;
      
      var updates = [];
      var completed = false, start, worker = function(now) {
        var ctx, percent, elasped, val,i,l;
        
        if(!start) start = now;
        
        elapsed = now - start;
        if(elapsed > total) completed=true, elapsed=total;
        percent = elapsed/total;
        val = easing(percent, elapsed, 0, 1, total);
        
        for(i=0,l=updates.length;i<l;i++) updates[i](val);
        
        if(!completed) return requestFrame(worker);
      }
      
      return ctx = {
        start: function() { requestFrame(worker); return ctx; },
        reset: function() { completed = false; start = undefined; return ctx; },
        restart: function() { return ctx.reset().start(); },
        update: function(fn, start, end, tr) {
          var transformed = tr ? function(val) { fn(tr(val)); } : fn;
          var result = (start != null) && (end != null) ?
              function(val) { transformed(val*(end-start)+start); } : transformed;
          updates.push(result);
          return ctx;
        }
      };
    };
    
    var toUnits = function(units) { return function(v) { return v+units; }; };
    fn.pixels = toUnits("px");
    fn.em = toUnits("em");
    
    var noop = function() {};
    fn.with = function(ctx, target) {
      if (target && target.call == Function.prototype.call) 
        return function callback(val) { target.call(ctx, val); };
      if(ctx && target)
        return function(val) { ctx[target] = val; };
      return noop;
    };
                 
    // Easing functions.
    fn.easing = (function() {
      var quad = {
        in: function (n,e,t,a,r) { return a*(e/=r)*e+t; },
        out: function (n,e,t,a,r) { return-a*(e/=r)*(e-2)+t; },
        both: function (n,e,t,a,r) { return(e/=r/2)<1?a/2*e*e+t:-a/2*(--e*(e-2)-1)+t; }
      };
                 
      return {
        "linear": function(n,e,t,a,r) { return n*(a-t)+t; },
        "quad": quad
      };
    }());
    
    return fn;
  }());  
  
  var bind = Function.prototype.bind,
      call = Function.prototype.call,
      slice = call.bind(Array.prototype.slice);
  
  return function storyMachine(target, cache) {
    
    var handleClick = function(e) {
      var elem = e.target, node = e.currentTarget;
      
      if(node.classList.contains("complete")) {
        e.preventDefault();
        return;
      }
      
      // Find closest `.answer`
      do {
        if(elem.classList.contains("answer")) {
          var answer = elem;
          
          e.preventDefault();
          var name = answer.getAttribute("href").substr(1)
          if(!has(name)) return;
          
          var next = render(name);
          next.classList.add("new"); 
          next.classList.add("current");
          // force layout
          var top = next.offsetTop; 
          next.classList.remove("new");
          
          answer.classList.add("selected");
          
          node.classList.add("complete");
          node.classList.remove("current");
          
          var root = document.documentElement || document.body;
          mator(500, mator.easing.quad.both) 
            .update(mator.with(root, "scrollTop"), root.scrollTop, top)
            .start();
          return;
        }
      } while(elem=elem.parentElement);
    };
    
    cache = cache || {};
    
    var typeHandlers = {};
    
    var tagHandlers = {
      "DIV": function(element) {
        var name = element.getAttribute("id"),
            content = element.innerHTML;
        add(name, content);
      },
      "SCRIPT": function(element) {
        var name = element.getAttribute("id"),
            content = (element.innerText || element.textContent),
            handler = typeHandlers[element.getAttribute("type")];

        if(handler) content = handler(content);
        add(name, content);
      }
    }

    var has = function(name) { return !!cache[name]; },
        add = function(name, content) { cache[name] = content; },
        registerType = function(mime, fn) {
          typeHandlers[mime] = fn;
        },
        render = function(name) {
          var content = cache[name];
          if(!content) return;
          var node = document.createElement("section");
          node.innerHTML = content;
          node.addEventListener("click", handleClick);
          target.appendChild(node);
          return node;
        },
        addElems = function(nodeList) {
          var i,l,element, handler;
           
          for(var i=0,l=nodeList.length;i<l;i++) {
            element = nodeList[i];
            element.parentElement.removeChild(element);
            handler = tagHandlers[element.tagName] || tagHandlers["DIV"];
            handler(element);
          }
        };
    
    return { add: add, render: render, addElements: addElems, registerType: registerType };
  };
}());