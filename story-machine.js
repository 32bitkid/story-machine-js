(function() {
  
  var bind = Function.prototype.bind,
      call = Function.prototype.call,
      slice = call.bind(Array.prototype.slice),
      extend = function(obj) {
        var rest = slice(arguments, 1), i, l, source, prop;
        for(i=0,l=rest.length;i<l;i++) {
          source = rest[i];
          for(prop in source) {
            obj[prop] = source[prop];
          }
        }
        return obj;
      },
      defaultOptions = {
        target: undefined,
        elements: undefined,
        onSectionAdded: function(next) {
          var root = document.documentElement || document.body;
          root.scrollTop = next.offsetTop;
        },
        register: {}
      };

  var storyMachine = function(options) {
    options = extend({}, defaultOptions, options);
    
    var handleClick = function(e) {
      var elem = e.target, node = e.currentTarget, answer;
      
      if(node.classList.contains("complete")) {
        e.preventDefault();
        return;
      }
      
      // Find closest `.answer`
      do {
        if(elem.classList.contains("answer")) {
          answer = elem;
          break;
        }
      } while((elem=elem.parentElement) !== null);

      if(answer===undefined) return;

      e.preventDefault();

      var name = answer.getAttribute("href").substr(1);

      if(!has(name)) return;

      var next = render(name);
      next.classList.add("current");
      next.classList.add("new");
      var forceLayout = next.offsetTop; // force layout
      next.classList.remove("new");

      answer.classList.add("selected");

      node.classList.add("complete");
      node.classList.remove("current");

      var fn = options.onSectionAdded;
      if(fn && fn.call == call) fn.call(void 0, next);

      return;
    };
    
    
    var target = options.target,
        cache = {},
        typeHandlers = {},
        tagHandlers = {
          "DIV": function handleDiv(element) {
            var name = element.getAttribute("id"),
                content = element.innerHTML;
            add(name, content);
          },
          "SCRIPT": function handleScript(element) {
            var name = element.getAttribute("id"),
                content = (element.innerText || element.textContent),
                handler = typeHandlers[element.getAttribute("type")];

            if(handler) content = handler(content);
            add(name, content);
          }
        },
        defaultTagHandler = tagHandlers.DIV;

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
        addElements = function(nodeList) {
          var i,l,element, handler;
           
          for(i=0,l=nodeList.length;i<l;i++) {
            element = nodeList[i];
            element.parentElement.removeChild(element);
            handler = tagHandlers[element.tagName] || defaultTagHandler;
            handler(element);
          }
        };
    
    if(options.register) {
      for(var key in options.register) {
        registerType(key, options.register[key]);
      }
    }
    
    if(options.elements) addElements(options.elements);
    
    return { add: add, render: render, addElements: addElements, registerType: registerType };
  };

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = storyMachine;
    }
    exports.storyMachine = storyMachine;
  } else {
    this.storyMachine = storyMachine;
  }
}).call(this);