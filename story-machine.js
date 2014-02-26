/* jshint strict: true, undef: true, unused: true */
/* global document, module, exports: true */
(function() {
  "use strict";  
  
  // Quick-references to call.
  var call = Function.prototype.call,
      // Bind a callable version of slice.
      slice = call.bind(Array.prototype.slice),
      
      // Extend copies all the properties from the *source*
      // objects into the *target* object.
      extend = function(target) {
        var sources = slice(arguments, 1), i, l, source, prop;
        for(i=0,l=sources.length;i<l;i++) {
          source = sources[i];
          for(prop in source) {
            target[prop] = source[prop];
          }
        }
        return target;
      },
      
      // Create the default options objects.
      defaultOptions = {
        // This is the reference to the target element
        // that the other elements will be appended into.
        target: undefined,
        
        // This is an optional set of elements to seed the
        // section cache. This is essentially the same as 
        // using the `addElements` function.
        elements: undefined,
        
        // This callback is invoked whenever a new node
        // is appended to `target`.
        //
        // The default implementation
        // will try to scroll top of the element into view of
        // document.
        onSectionAdded: function(next) {
          var root = document.documentElement || document.body;
          root.scrollTop = next.offsetTop;
        },
        
        // This object is used to bootstrap type 
        // registrations. See the `registerType()`
        // for more details.
        register: {}
      };

  // Create the `storyMachine` function. This
  // is main entry point for this library.
  var storyMachine = function(options) {
    
    // Apply the user `options` over the `defaultOptions`.
    options = extend({}, defaultOptions, options);
    
    // This callback handles all click events that
    // bubble to the generated node.
    var handleClick = function(e) {
      var elem = e.target, node = e.currentTarget, answer;
      
      // If the node is complete.
      if(node.classList.contains("complete")) {
        // Then don't allow any clicks to work in them anymore
        // so prevent default and move on.
        e.preventDefault();
        return;
      }
      
      // Only handle this event if event, if it was
      // dispatched from an "answer" or a child of 
      // an answer.
      do {
        
        // Is the element an answer?
        if(elem.classList.contains("answer")) {
          // Then hold on to it and break out of the loop
          answer = elem;
          break;
        }
        
        // Otherwise, set the referece of `elem` to its
        // parent, and end the loop if the element doesn't
        // have a parent.
      } while((elem=elem.parentElement) !== null);

      // If this event wasn't dispatched from an element
      // that we care about, then don't worry about it.
      if(answer===undefined) return;

      // Prevent the default action.
      e.preventDefault();
      
      // Answer links should have an `href` attribute
      // that is set an anchor of the `name` of the page that 
      // should be displayed next.
      // 
      // For example, if you wanted to display a page 
      // named `"foo"` next, then you would want a link
      // that looked something like this:
      //
      // ```html
      // <a href="#foo">Go to Foo</a>
      // ```
      var name = answer.getAttribute("href").substr(1);

      // Check to make sure that a page by that name
      // has been added to the cache.
      if(!has(name)) return;

      // Render the page.
      var next = render(name);
      
      // Set the newly generated page as the current node,
      // and also add a `new` class to the element.
      next.classList.add("current");
      next.classList.add("new");
      // Force the browser to perform a layout by reading the `offsetTop`
      // property of the newly generated element.
      /* jshint -W030 */
      next.offsetTop;
      /* jshint +W030 */
      
      // Then, immediately remove the `new` class. This
      // allows clients to perform class based CSS
      // animations and transitions for newly added
      // nodes.
      next.classList.remove("new");

      // Set the answer as the selected answer.
      answer.classList.add("selected");

      // Set the previous node as complete.
      node.classList.add("complete");
      node.classList.remove("current");

      // Invoke the `onSectionAdded` callback
      // if it exists and if it is a function.
      var fn = options.onSectionAdded;
      if(fn && fn.call == call) fn.call(void 0, next);
    };
    
        
    var target = options.target,
        // This is the node cache. All nodes that are added, get stored in
        // this object.
        cache = {},
        
        // This object holds all of the registered types and thier transformers.
        typeHandlers = {},
        
        // Create element handlers, for when using the
        // `addElements()` helper.
        tagHandlers = {
          // Handle `div` elements by using the `id` attribute
          // as the node name, and the `innerHTML` of the element
          // as its content.
          "DIV": function handleDiv(element) {
            var name = element.getAttribute("id"),
                content = element.innerHTML;
            add(name, content);
          },
          
          // Handle `script` elements by using the `id` attribute
          // as the node name, then retrieve the raw text of the 
          // element.
          //
          // Also, check the `type` attribute of the element
          // to see if a type handler has been registered. If
          // there has, then run the content through the 
          // transformer.
          "SCRIPT": function handleScript(element) {
            var name = element.getAttribute("id"),
                content = (element.innerText || element.textContent),
                handler = typeHandlers[element.getAttribute("type")];

            if(handler) content = handler(content);
            add(name, content);
          }
        },
        // Use the `div` element as the default tag handler.
        defaultTagHandler = tagHandlers.DIV;

    // The `has` function is a helper that checks to see if the cache
    // has a node of a specific name.
    var has = function(name) { return !!cache[name]; },
        
        // Add a node into the cache.
        // > TODO: Add an argument to specify the type of the node.
        add = function(name, content) { cache[name] = content; },
        
        // Register a type and a transformation function. 
        // 
        // This can be used when adding elements using the `<script>` form.
        // 
        // For example, if you had an node with some markdown content:
        //
        // ```html
        // <script id="foo" type="text/x-markdown">
        // # Foo
        // markdown content here...
        // </script>
        // ```
        //
        // You could then process it by registering the following transformer:
        //
        // ```js
        // myStory.registerType("text/x-markdown", function(content) { return Markdown.render(content); });
        // ```
        registerType = function(mime, fn) {
          typeHandlers[mime] = fn;
        },
        
        // Render the node
        render = function(name) {
          // Find the node's content by name.
          var content = cache[name];
          // Return if no content was found.
          if(!content) return;
          // Create a new element for the node.
          var node = document.createElement("section");
          // Inject the content into the element
          node.innerHTML = content;
          // Add the click handler.
          node.addEventListener("click", handleClick);
          // Append the node to the target element.
          target.appendChild(node);
          // Return the node.
          return node;
        },
        // Add nodes into the cache from a set of DOM elements.
        addElements = function(nodeList) {
          var i,l,element, handler;
           
          // Loop through the nodes
          for(i=0,l=nodeList.length;i<l;i++) {
            element = nodeList[i];
            // Remove the element from the DOM
            // > TODO: Be defensive. Perhaps pass in an option
            // > to determine if the element should be removed
            element.parentElement.removeChild(element);
            // Check the registered handlers for a handler of this
            // type and invoke it.
            handler = tagHandlers[element.tagName] || defaultTagHandler;
            handler(element);
          }
        };
    
    // If the user options include `register` option
    if(options.register) {
      // Then loop through them and register each one in the type register cache.
      for(var key in options.register) {
        registerType(key, options.register[key]);
      }
    }
    
    // If the user options includes a set of elements, then add them. 
    if(options.elements) addElements(options.elements);
    
    // Return the external interface.
    return { add: add, render: render, addElements: addElements, registerType: registerType };
  };

  // Export `storyMachine`. 
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = storyMachine;
    }
    exports.storyMachine = storyMachine;
  } else {
    this.storyMachine = storyMachine;
  }
}).call(this);