function QxClientDocument(clientWindow)
{
  QxWidget.call(this);

  this._window = clientWindow;
  this._document = this._window.getElement().document;

  // Init element
  this.setElement(this._document.body);

  // Cache current size
  this._lastBodyWidth = this._document.body.offsetWidth;
  this._lastBodyHeight = this._document.body.offsetHeight;

  // Add Resize Handler
  this.addEventListener("resize", this._onresize);
  
  // Theme
  this.setTheme(this._themes[0]);

  // Activate focus handling
  this.setTabIndex(1);
  
  // Blocker and Dialog Support
  this._blocker = new QxBlocker;
  this._modalWidgets = [];
  this._modalNativeWindow = null;

  function blockerImpl(e) 
  {
    if (this._modalNativeWindow && this._modalNativeWindow.getReady()) 
    {
      try
      {
        this._modalNativeWindow._window.focus(); 
      }
      catch(ex)
      {
        this.debug("Window seems to be closed already! => Releasing Blocker: (" + e.getType() + ")");
        this.release(this._modalNativeWindow);
      };
    };
  };

  // Blocker Events
  this._blocker.addEventListener("mousedown", blockerImpl, this);
  this._blocker.addEventListener("mouseup", blockerImpl, this);
};

QxClientDocument.extend(QxWidget, "QxClientDocument");

QxClientDocument.addProperty({ name : "theme", type : String });
QxClientDocument.addProperty({ name : "globalCursor", type : String });



/*
------------------------------------------------------------------------------------
  OVERWRITE WIDGET FUNCTIONS/PROPERTIES
------------------------------------------------------------------------------------
*/

proto._renderInitialDone_horizontal = true;
proto._renderInitialDone_vertical = true;

proto._childOuterWidthChanged = function(vModifiedChild, vHint) {};
proto._childOuterHeightChanged = function(vModifiedChild, vHint) {};

proto._modifyParent = function() { return true; };
proto._modifyVisible = function() { return true; };

proto._modifyElement = function(propValue, propOldValue, propName, uniqModIds)
{
  if (!propValue) {
    throw new Error("QxClientDocument does not accept invalid elements!");
  };

  // add reference to widget instance
  propValue._QxWidget = this;

  // apply cached properties and attributes
  this._applyStyleProperties(propValue, uniqModIds);
  this._applyHtmlProperties(propValue, uniqModIds);
  this._applyHtmlAttributes(propValue, uniqModIds);

  // make visibible
  this.setVisible(true, uniqModIds);

  return true;
};

proto.getWindow = function() { return this._window; };
proto.getTopLevelWidget = function() { return this; };
proto.getDocumentElement = function() { return this._document; };

proto.getEventManager = function() { return this._window.getEventManager(); };
proto.getFocusManager = function() { return this._window.getFocusManager(); };

proto._createElement = proto.createElementWrapper = function() { return true; };

proto.isCreated = function() { return true; };
proto.isFocusRoot = function() { return true; };
proto.getFocusRoot = function() { return this; };

proto.getToolTip = function() { return null; };
proto.getParent = function() { return null; };
proto.canGetFocus = function() { return true; };

proto._visualizeBlur = function() {};
proto._visualizeFocus = function() {};



/*
------------------------------------------------------------------------------------
  BLOCKER AND DIALOG SUPPORT
------------------------------------------------------------------------------------
*/

proto.block = function(activeWidget) 
{
  this.add(this._blocker);

  if (typeof QxWindow == "function" && activeWidget instanceof QxWindow)  
  {
    this._modalWidgets.push(activeWidget);
    
    var o = activeWidget.getZIndex();
    this._blocker.setZIndex(o);
    activeWidget.setZIndex(o+1);
  }
  else if (activeWidget instanceof QxNativeWindow)
  {
    this._modalNativeWindow = activeWidget;
    this._blocker.setZIndex(1e7);
  };
};

proto.release = function(activeWidget) 
{
  if (activeWidget) 
  {
    if (activeWidget instanceof QxNativeWindow)
    {
      this._modalNativeWindow = null;
    }
    else
    {
      this._modalWidgets.remove(activeWidget);
    };
  };
  
  var l = this._modalWidgets.length;
  if (l == 0)
  {
    this.remove(this._blocker);  
  }
  else
  {
    var oldActiveWidget = this._modalWidgets[l-1];
    
    var o = oldActiveWidget.getZIndex();
    this._blocker.setZIndex(o);
    oldActiveWidget.setZIndex(o+1);
  };
};





/*
------------------------------------------------------------------------------------
  GLOBAL CURSOR SUPPORT

  REF: http://www.xml.com/pub/a/2000/06/07/xmlterm/
       http://www.mozilla.org/docs/web-developer/css1technote/css1tojs.html
------------------------------------------------------------------------------------
*/

if ((new QxClient).isMshtml())
{
  proto._modifyGlobalCursor = function(propValue, propOldValue, propName, uniqModIds)
  {
    var s = this._cursorStyleSheetElement;
    
    if (!s) {
      s = this._cursorStyleSheetElement = this._document.createStyleSheet();
    };

    // mshtml direct method
    s.cssText = isValidString(propValue) ? "*{cursor:" + propValue + " !important}" : "";
    
    return true;
  };
}
else
{
  proto._modifyGlobalCursor = function(propValue, propOldValue, propName, uniqModIds)
  {
    var s = this._cursorStyleSheetElement;
    
    if (!s)
    {
      s = this._cursorStyleSheetElement = this._document.createElement("style");
      s.type = "text/css";
      this._document.getElementsByTagName("head")[0].appendChild(s);
    };

    var sheet = s.sheet;

    // clean out old rule(s)
    var l = sheet.cssRules.length;
    for (var i=l-1; i>=0; i--) {
      sheet.deleteRule(i);
    };

    // add new cursor style
    if (isValidString(propValue)) {
      sheet.insertRule("*{cursor:" + propValue + " !important}", 0);
    };
    
    return true;
  };
};




/*
------------------------------------------------------------------------------------
  WINDOW RESIZE HANDLING
------------------------------------------------------------------------------------
*/

proto._onresize = function(e)
{
  // Hide popups, tooltips, ...
  if (typeof QxPopupManager == "function") {
    (new QxPopupManager).update();
  };

  // Update children
  var w = this._document.body.offsetWidth;
  var h = this._document.body.offsetHeight;

  if(this._lastBodyWidth != w)
  {
    this._lastBodyWidth = w;
    this._innerWidthChanged();
  };

  if (this._lastBodyHeight != h)
  {
    this._lastBodyHeight = h;
    this._innerHeightChanged();
  };
};





/*
------------------------------------------------------------------------------------
  THEME SUPPORT
------------------------------------------------------------------------------------
*/

proto._themes = [ "Win9x", "WinXP" ];

proto.getThemes = function()
{
  return this._themes;
};

proto.registerTheme = function(v)
{
  if (this._themes.contains(v)) {
    return;
  };
    
  this._themes.push(v);  
};

proto.deregisterTheme = function(v)
{
  if (this.getTheme()==v) {
    throw new Error("Could not remove currently selected theme!");
  };
  
  this._themes.remove(v);
  return true;
};

proto._modifyTheme = function(propValue, propOldValue, propName, uniqModIds)
{
  var vClass = this.getCssClassName();

  if (propOldValue) {
    vClass = vClass.remove("QxTheme" + propOldValue, " ");
  };

  if (propValue) {
    vClass = vClass.add("QxTheme" + propValue, " ");
  };

  this.setCssClassName(vClass);
  return true;
};





/*
------------------------------------------------------------------------------------
  INLINE WIDGET SUPPORT
------------------------------------------------------------------------------------
*/

proto.add = function()
{
  var a = arguments;
  var l = a.length;
  var t = a[l-1];

  if (typeof QxInline == "function" && l > 1 && typeof t == "string")
  {
    for (var i=0; i<l-1; i++)
    {
      if (a[i] instanceof QxInline) {
        a[i].setInlineNodeId(t);
      };

      a[i].setParent(this);
    };

    return this;
  }
  else
  {
    return QxWidget.prototype.add.apply(this, arguments);
  };
};

proto._getParentNodeForChild = function(otherObject)
{
  if (typeof QxInline == "function" && otherObject instanceof QxInline)
  {
    var inlineNodeId = otherObject.getInlineNodeId();

    if (isValid(inlineNodeId))
    {
      var inlineNode = document.getElementById(inlineNodeId);

      if (inlineNode) {
        return inlineNode;
      };
    };

    throw new Error("Couldn't find target element for: " + otherObject);
  };

  return this.getElement();
};







/*
------------------------------------------------------------------------------------
  DISPOSER
------------------------------------------------------------------------------------
*/

proto.dispose = function()
{
  if (this.getDisposed()) {
    return;
  };

  this._window = this._document = null;

  QxWidget.prototype.dispose.call(this);

  return true;
};
