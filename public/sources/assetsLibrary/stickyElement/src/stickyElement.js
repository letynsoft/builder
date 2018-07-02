(function(window) {
  function vcSticky(selector, options = {}) {
    this.selector = selector;
    this.elements = [];

    this.vp = getViewportSize();
    this.body = document.querySelector('body');

    this.options = {
      wrap: options.wrap || true,
      marginTop: options.marginTop || 0,
      stickyFor: options.stickyFor || 0,
      stickyClass: options.stickyClass || null,
      stickyContainer: options.stickyContainer || 'body',
    };

    updateScrollTopPosition = updateScrollTopPosition.bind(this);
    run = run.bind(this);
    renderElement = renderElement.bind(this);
    wrapElement = wrapElement.bind(this);
    activate = activate.bind(this);
    initResizeEvents = initResizeEvents.bind(this);
    destroyResizeEvents = destroyResizeEvents.bind(this);
    onResizeEvents = onResizeEvents.bind(this);
    onScrollEvents = onScrollEvents.bind(this);
    setPosition = setPosition.bind(this);
    update = update.bind(this);
    getStickyContainer = getStickyContainer.bind(this);
    getRectangle = getRectangle.bind(this);
    getViewportSize = getViewportSize.bind(this);
    updateScrollTopPosition = updateScrollTopPosition.bind(this);
    forEach = forEach.bind(this);
    css = css.bind(this);

    updateScrollTopPosition();
    window.addEventListener('load', updateScrollTopPosition);
    window.addEventListener('scroll', updateScrollTopPosition);

    run();
  }

  // ========= Public Methods =========

  /**
   * Destroys sticky element, remove listeners
   * @function
   */
  vcSticky.prototype.destroy = function() {
    forEach(this.elements, (element) => {
      destroyResizeEvents(element);
      destroyScrollEvents(element);
      delete element.sticky;
    });
  }

  // ========= Private Methods =========

  /**
   * Function that waits for page to be fully loaded and then renders & activates every sticky element found with specified selector
   * @function
   */
  function run() {
    // wait for page to be fully loaded
    const pageLoaded = setInterval(() => {
      if (document.readyState === 'complete') {
        clearInterval(pageLoaded);

        const elements = document.querySelectorAll(this.selector);
        forEach(elements, (element) => renderElement(element));
      }
    }, 10);
  }


  /**
   * Function that assign needed variables for sticky element, that are used in future for calculations and other
   * @function
   * @param {node} element - Element to be rendered
   */
  function renderElement(element) {
    // create container for variables needed in future
    element.sticky = {};

    // set default variables
    element.sticky.active = false;

    element.sticky.marginTop = parseInt(element.getAttribute('data-margin-top')) || this.options.marginTop;
    element.sticky.stickyFor = parseInt(element.getAttribute('data-sticky-for')) || this.options.stickyFor;
    element.sticky.stickyClass = element.getAttribute('data-sticky-class') || this.options.stickyClass;
    element.sticky.wrap = element.hasAttribute('data-sticky-wrap') ? true : this.options.wrap;
    element.sticky.stickyContainer = this.options.stickyContainer;

    element.sticky.container = getStickyContainer(element);
    element.sticky.container.rect = getRectangle(element.sticky.container, true);

    element.sticky.rect = getRectangle(element);

    // fix when element is image that has not yet loaded and width, height = 0
    if (element.tagName.toLowerCase() === 'img') {
      element.onload = () => element.sticky.rect = getRectangle(element);
    }

    if (element.sticky.wrap) {
      // wrapElement(element);
    }

    // activate rendered element
    activate(element);
  }


  /**
   * Wraps element into placeholder element
   * @function
   * @param {node} element - Element to be wrapped
   */
  function wrapElement(element) {
    element.insertAdjacentHTML('beforebegin', '<span></span>');
    element.previousSibling.appendChild(element);
  }


  /**
   * Function that activates element when specified conditions are met and then initalise events
   * @function
   * @param {node} element - Element to be activated
   */
  function activate(element) {
    if (
      ((element.sticky.rect.top + element.sticky.rect.height) < (element.sticky.container.rect.top + element.sticky.container.rect.height))
      && (element.sticky.stickyFor < this.vp.width)
      && !element.sticky.active
    ) {
      element.sticky.active = true;
    }

    if (this.elements.indexOf(element) < 0) {
      this.elements.push(element);
    }

    if (!element.sticky.resizeEvent) {
      initResizeEvents(element);
      element.sticky.resizeEvent = true;
    }

    if (!element.sticky.scrollEvent) {
      initScrollEvents(element);
      element.sticky.scrollEvent = true;
    }

    setPosition(element);
  }


  /**
   * Function which is adding onResizeEvents to window listener and assigns function to element as resizeListener
   * @function
   * @param {node} element - Element for which resize events are initialised
   */
  function initResizeEvents(element) {
    element.sticky.resizeListener = () => onResizeEvents(element);
    window.addEventListener('resize', element.sticky.resizeListener);
  }


  /**
   * Removes element listener from resize event
   * @function
   * @param {node} element - Element from which listener is deleted
   */
  function destroyResizeEvents(element) {
    if (element && element.sticky) {
      window.removeEventListener('resize', element.sticky.resizeListener);
    }
  }


  /**
   * Function which is fired when user resize window. It checks if element should be activated or deactivated and then run setPosition function
   * @function
   * @param {node} element - Element for which event function is fired
   */
  function onResizeEvents(element) {
    this.vp = getViewportSize();

    element.sticky.rect = getRectangle(element);
    element.sticky.container.rect = getRectangle(element.sticky.container, true);

    if (
      ((element.sticky.rect.top + element.sticky.rect.height) < (element.sticky.container.rect.top + element.sticky.container.rect.height))
      && (element.sticky.stickyFor < this.vp.width)
      && !element.sticky.active
    ) {
      element.sticky.active = true;
    } else if (
      ((element.sticky.rect.top + element.sticky.rect.height) >= (element.sticky.container.rect.top + element.sticky.container.rect.height))
      || element.sticky.stickyFor >= this.vp.width
      && element.sticky.active
    ) {
      element.sticky.active = false;
    }

    setPosition(element);
  }


  /**
   * Function which is adding onScrollEvents to window listener and assigns function to element as scrollListener
   * @function
   * @param {node} element - Element for which scroll events are initialised
   */
  function initScrollEvents(element) {
    element.sticky.scrollListener = () => onScrollEvents(element);
    window.addEventListener('scroll', element.sticky.scrollListener);
  }


  /**
   * Removes element listener from scroll event
   * @function
   * @param {node} element - Element from which listener is deleted
   */
  function destroyScrollEvents(element) {
    if (element && element.sticky) {
      window.removeEventListener('scroll', element.sticky.scrollListener);
    }
  }


  /**
   * Function which is fired when user scroll window. If element is active, function is invoking setPosition function
   * @function
   * @param {node} element - Element for which event function is fired
   */
  function onScrollEvents(element) {
    if (element && element.sticky && element.sticky.active) {
      setPosition(element);
    }
  }


  /**
   * Main function for the library. Here are some condition calculations and css appending for sticky element when user scroll window
   * @function
   * @param {node} element - Element that will be positioned if it's active
   */
  function setPosition(element) {
    css(element, { position: '', width: '', top: '', left: '' });

    if ((this.vp.height < element.sticky.rect.height) || !element.sticky.active) {
      return;
    }

    if (!element.sticky.rect.width) {
      element.sticky.rect = getRectangle(element);
    }

    if (element.sticky.wrap) {
      css(element.parentNode, {
        display: 'block',
        width: element.sticky.rect.width + 'px',
        height: element.sticky.rect.height + 'px',
      });
    }

    if (
      element.sticky.rect.top === 0
      && element.sticky.container === this.body
    ) {
      css(element, {
        position: 'fixed',
        top: element.sticky.rect.top + 'px',
        left: element.sticky.rect.left + 'px',
        width: element.sticky.rect.width + 'px',
      });
    } else if (this.scrollTop > (element.sticky.rect.top - element.sticky.marginTop)) {
      css(element, {
        position: 'fixed',
        width: element.sticky.rect.width + 'px',
        left: element.sticky.rect.left + 'px',
      });

      if (
        (this.scrollTop + element.sticky.rect.height + element.sticky.marginTop)
        > (element.sticky.container.rect.top + element.sticky.container.offsetHeight)
      ) {

        if (element.sticky.stickyClass) {
          element.classList.remove(element.sticky.stickyClass);
        }

        css(element, {
          top: (element.sticky.container.rect.top + element.sticky.container.offsetHeight) - (this.scrollTop + element.sticky.rect.height) + 'px' }
        );
      } else {
        if (element.sticky.stickyClass) {
          element.classList.add(element.sticky.stickyClass);
        }

        css(element, { top: element.sticky.marginTop + 'px' });
      }
    } else {
      if (element.sticky.stickyClass) {
        element.classList.remove(element.sticky.stickyClass);
      }

      css(element, { position: '', width: '', top: '', left: '' });

      if (element.sticky.wrap) {
        css(element.parentNode, { display: '', width: '', height: '' });
      }
    }
  }


  /**
   * Function that updates element sticky rectangle (with sticky container), then activate or deactivate element, then update position if it's active
   * @function
   */
  function update() {
    forEach(this.elements, (element) => {
      element.sticky.rect = getRectangle(element);
      element.sticky.container.rect = getRectangle(element.sticky.container, true);

      activate(element);
      setPosition(element);
    });
  }


  /**
   * Function that returns container element in which sticky element is stuck (if is not specified, then it's stuck to body)
   * @function
   * @param {node} element - Element which sticky container are looked for
   * @return {node} element - Sticky container
   */
  function getStickyContainer(element) {
    let container = element.parentNode;

    while (
      !container.hasAttribute('data-sticky-container')
      && !container.parentNode.querySelector(element.sticky.stickyContainer)
      && container !== this.body
      ) {
      container = container.parentNode;
    }

    return container;
  }


  /**
   * Function that returns element rectangle & position (width, height, top, left)
   * @function
   * @param {node} element - Element which position & rectangle are returned
   * @return {object}
   */
  function getRectangle(element, isParent) {
    css(element, { position: '', width: '', top: '', left: '' });

    // reset parents css
    if (!isParent) {
      css(element.parentElement, { position: '', width: '', top: '', left: '' });
    }

    const elementRect = element.getBoundingClientRect();

    const body = document.body;
    const docEl = document.documentElement;

    const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    const clientTop = docEl.clientTop || body.clientTop || 0;
    const clientLeft = docEl.clientLeft || body.clientLeft || 0;

    const top  = elementRect.top +  scrollTop - clientTop;
    const left = elementRect.left + scrollLeft - clientLeft;
    const width = elementRect.width;
    const height = elementRect.height;

    return { top, left, width, height };
  }


  /**
   * Function that returns viewport dimensions
   * @function
   * @return {object}
   */
  function getViewportSize() {
    return {
      width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
    };
  }


  /**
   * Function that updates window scroll position
   * @function
   * @return {number}
   */
  function updateScrollTopPosition() {
    this.scrollTop = (window.pageYOffset || document.scrollTop)  - (document.clientTop || 0) || 0;
  }


  /**
   * Helper function for loops
   * @helper
   * @param array
   * @param {function} callback - Callback function (no need for explanation)
   */
  function forEach(array, callback) {
    for (let i = 0, len = array.length; i < len; i++) {
      callback(array[i]);
    }
  }


  /**
   * Helper function to add/remove css properties for specified element.
   * @helper
   * @param {node} element - DOM element
   * @param {object} properties - CSS properties that will be added/removed from specified element
   */
  function css(element, properties) {
    if (!element) {
      return;
    }
    for (let property in properties) {
      if (properties.hasOwnProperty(property)) {
        element.style[property] = properties[property];
      }
    }
  }


  /**
   * Add to global namespace.
   */

  window.vcSticky = vcSticky;
}(window));