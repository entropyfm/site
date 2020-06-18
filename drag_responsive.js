$(document).ready(function () {
// Document ready ...classes aren't hoisted
$(() => {
  var xPercent = $("#x-percent");
  var yPercent = $("#y-percent");

  // Create a new custom draggable
  var box = new CustomDraggable("#box", {
    onDrag: updateHud,
    onThrowUpdate: updateHud,
    onThrowComplete: updateHud });


  $(window).resize(_.debounce(updateHud, 30));
  updateHud();

  // Displays the draggable's position as a percentage
  function updateHud() {

    var xValue = box.isActive ? box.xPos / box.xMax * 100 : box.xPercent;
    var yValue = box.isActive ? box.yPos / box.yMax * 100 : box.yPercent;

    xPercent.text(Math.abs(xValue).toFixed(1));
    yPercent.text(Math.abs(yValue).toFixed(1));
  }
});

// CUSTOM DRAGGABLE
// Extends the Draggable class to create a new type 
// of Draggable that is repsonsive
class CustomDraggable extends Draggable {
  constructor(target, vars) {

    // Call constructor for Draggable
    super(target);

    // Copy the original vars object
    this._vars = vars;
    this.parent = this.target.parentNode || document.body;

    // Set this.vars with some defaults and intercepts
    _.assign(this.vars, vars, {
      bounds: vars.bounds || this.parent,
      throwProps: true,
      onClick: this.createInterceptor("onClick"),
      onDrag: this.createInterceptor("onDrag"),
      onDragEnd: this.createInterceptor("onDragEnd"),
      onDragStart: this.createInterceptor("onDragStart"),
      onPress: this.createInterceptor("onPress"),
      onRelease: this.createInterceptor("onRelease"),
      onThrowComplete: this.createInterceptor("onThrowComplete"),
      onThrowUpdate: this.createInterceptor("onThrowUpdate") });


    this.transform = this.target._gsTransform;
    this.width = this.target.offsetWidth;
    this.height = this.target.offsetHeight;

    // Caches the parent width|height
    // Helps prevent choppy animation while the HUD 
    // update function is calculating its position
    $(window).resize(e => this.updateBounds());
    this.updateBounds();

    // Center the draggable
    this.positionRelative(50, 50);

    // Active when dragging or thrown
    this.isActive = false;

    // Bind all the methods so we don't have to deal with scope
    _.bindAll(this);
  }

  // Returns the parent's width|height - the target's width|height
  get xMax() {return this.parentWidth - this.width;}
  get yMax() {return this.parentHeight - this.height;}

  get xPos() {return this.transform.x;}
  set xPos(value) {this.set({ x: value });}

  get yPos() {return this.transform.y;}
  set yPos(value) {this.set({ y: value });}

  get xPercent() {return this._xPercent;}
  set xPercent(value) {
    this._xPercent = value;
    this.set({ left: value + "%", xPercent: -value });
  }

  get yPercent() {return this._yPercent;}
  set yPercent(value) {
    this._yPercent = value;
    this.set({ top: value + "%", yPercent: -value });
  }

  // Creates an interceptor function for callbacks in the original vars object
  createInterceptor(callbackName) {
    return () => {

      var intercept = this["_" + callbackName];
      var callback = this._vars[callbackName];
      var scope = this._vars[callbackName + "Scope"] || this;
      var argsArray = this._vars[callbackName + "Params"] || [this.pointerEvent];

      // Pre-callback, i.e. this._onPress()
      //if (_.isFunction(intercept)) intercept();
      if (_.isFunction(intercept)) intercept.apply(this);

      // Callback, i.e. this._vars.onPress()
      if (_.isFunction(callback)) callback.apply(scope, argsArray);
    };
  }

  // Called on window resize to cache new width|height values    
  updateBounds() {
    this.parentWidth = this.parent.offsetWidth;
    this.parentHeight = this.parent.offsetHeight;
  }

  positionAbsolute(xPos, yPos, xPercent = 0, yPercent = 0) {

    this.xPos = xPos || this.xPercent * this.xMax / 100;
    this.yPos = yPos || this.yPercent * this.yMax / 100;
    this.xPercent = xPercent;
    this.yPercent = yPercent;
  }

  positionRelative(xPercent, yPercent, xPos = 0, yPos = 0) {

    this.xPercent = xPercent || this.xPos / this.xMax * 100;
    this.yPercent = yPercent || this.yPos / this.yMax * 100;
    this.xPos = xPos;
    this.yPos = yPos;
  }

  set(vars) {
    TweenLite.set(this.target, vars);
  }

  // CALLBACK INTERCEPTS
  // Create your callback intercept here. Prefix the name with an underscore
  // For example, if you want to run some code before onDrag is called, 
  // create a method named _onDrag below
  _onDragStart() {
    this.isActive = true;
  }

  _onPress() {
    if (!this.isActive) {
      this.positionAbsolute();
      this.update();
    }
  }

  _onRelease() {
    if (!this.isActive) {
      this.isActive = false;
      this.update(true);
      this.positionRelative();
    }
  }

  _onThrowComplete() {
    this.isActive = false;
    this.update(true);
    this.positionRelative();
  }}
});