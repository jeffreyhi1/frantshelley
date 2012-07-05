
"use strict";

if ("undefined" == typeof(Shelley)) {
var Shelley = {
      // context menu id per send issue
   sendy     : [ "context-sendimage", "context-sendlink", "context-sendpage" ],
      // context menu id per nsIDocShell property
   item2shell: [ "docShelley-javascript", "docShelley-redirects", "docShelley-subframes", "docShelley-plugins" ],
   seltabState:
      {
         allowJavascript   : true,
         allowSubframes    : true,
         allowMetaRedirects: true,
         allowPlugins      : true
      },
   timeout : null,   // update button timeout, window.clearTimeout.
//	docShelley-jstop -> cmd_shelleyCommon

   _fire: function(anevent)
   {
      if(Shelley.timeout) window.clearTimeout(Shelley.timeout);
      Shelley.timeout = window.setTimeout(Shelley.update, 222, anevent.target);
//      dump("_dvk_dbg_, fire type:\t"); dump(anevent.type); dump("\n")
   },

   update: function(aself)
      {
         Shelley.timeout = null;
   
         if(gBrowser)
         try {            
            var thedocshell = gBrowser.selectedBrowser.docShell;
      //	    theman.removeAttribute("disabled");
            document.getElementById("cmd_shelleyCommon").setAttribute(
                              "disabled", !(thedocshell.canExecuteScripts));
         }
         catch (e) {
            Components.utils.reportError(e)
         }
      },

   command: function(event)
      {
      if(gBrowser)
         gBrowser.selectedBrowser.docShell[this.value]
                     = !(Shelley.seltabState[this.value]);
//      dump("_dvk_dbg_, .selectedBrowser.contentDocument:\t"); dump(gBrowser.selectedBrowser.contentDocument);
      },

   // command id="cmd_shelleyCommon" oncommand="Shelley.cmdJstop();" 
   cmdJstop: function()
      {
         if(Shelley.timeout) window.clearTimeout(Shelley.timeout);
         var thebrowser = gBrowser.selectedBrowser;
         try {
            Shelley.seltabState.allowJavascript = true;
            Shelley.appendixStop(thebrowser);

            thebrowser.docShell.allowJavascript = false;
            Shelley.update(null);
         }
         catch (e) {
            Components.utils.reportError(e)
         }      
      },

   // menuitem id="docShelley-javascript" oncommand="Shelley.appendixStop();"
   appendixStop: function(abrowser)
      {
         if(Shelley.seltabState.allowJavascript)
         if(!(abrowser.contentDocument.loadOverlay))
            abrowser.webNavigation.stop(
               Components.interfaces.nsIWebNavigation.STOP_CONTENT);
      },

   // id="docShelley-allowall" menuitem's id="docShelley-disallow" 
   reset : function (newvalue)
      {
         if(!newvalue) Shelley.appendixStop(gBrowser.selectedBrowser);
      //	for allowall \ disallow
         var thedocshell = gBrowser.selectedBrowser.docShell;
         for (let theval in Shelley.seltabState)
              thedocshell[theval] = newvalue;
      },

   initialize: function(anallow)
      {

   // charge of Shelley.item2shell menu
      for each (let theval in Shelley.item2shell)
      {
         let thelement = document.getElementById(theval);
         thelement.addEventListener("command", Shelley.command, false);
      }

   // tab open of propagate and default behavior
      gBrowser.tabContainer.addEventListener("TabOpen", function (event)
                     {
                        window.setTimeout(Shelley.propagation, 1, event.target)
                     },
                     false);

   // update cmd_shelleyCommon -> toolbar button
      gBrowser.tabContainer.addEventListener("TabSelect", Shelley._fire, false);
      gBrowser.addEventListener("pageshow", Shelley._fire, false);
      window.setTimeout( function ()
         {
            gBrowser.addEventListener("DOMContentLoaded", Shelley._fire, false)
         }, 666);

      if(!anallow) gBrowser.selectedBrowser.docShell.allowPlugins = false;
         
      },

   // fire by TabOpen
   propagation: function(atarget, anallow)
      {
      if(gBrowser)
      try {
         if(gBrowser.selectedTab === atarget)
         {
            gBrowser.selectedBrowser.docShell.allowPlugins
                     = Shelley.main.getDefPlugins();
         }
         else {
//      dump("_dvk_dbg_, propagation.\n");
            var thedocshell = gBrowser.selectedBrowser.docShell;
            var thebrowser = gBrowser.getBrowserForTab(atarget);
            if(thebrowser)
            for (let theval in Shelley.seltabState)
               if(!(thedocshell[theval]))
                  thebrowser.docShell[theval] = false;
         }
      }
      catch (e) {
         Components.utils.reportError(e)
      }      
      }
   }  // var Shelley
}  // guard

   // "statusbar" of menu subsystem
Shelley.readyState = {
   content : null,
   element : null,
   _value   : "loading", // status of newpage

   initialize: function(acontent, amenu)
   {
      this.content = acontent.document;
      this.content.addEventListener("readystatechange", this);
      if(amenu)
      {
	 this.element = amenu;
	 acontent.addEventListener("unload", this);
      }
      else this.update(null);
   },

   update: function(avalue)
   {
      if(avalue) this.element.label = this.element.value + avalue;

      avalue = this.content.readyState;
	
      if(avalue === "complete")
      {
	 this.content.removeEventListener("readystatechange", this);
	 this.element.setAttribute("checked", "true");
	 this.element.label = this.element.value + avalue;
      }
      else
	 this.element.removeAttribute("checked");    
   },
    
   handleEvent: function( evt )
   {
      var thestate = this._value;
      if(evt.type == "readystatechange")
      {
	 thestate = this.content.readyState; // document.readyState;
	 if(thestate == "complete")
	 {
	    this.content.removeEventListener("readystatechange", this);
	    this.element.setAttribute("checked", "true");
	 }
      }
      else {	//	unload
	 window.setTimeout(	// refer to container: element.ownerDocument.
	    function() {
	       Shelley.readyState.initialize(this.content);
	    }, 1 );
//	this.content.addEventListener("readystatechange", this);
      }
      this.element.label = this.element.value + thestate;
   },

   terminate: function()
   {
      if(this.content)
      {
	 this.content.defaultView.removeEventListener("unload", this);
	 this.content.removeEventListener("readystatechange", this);
      }
      this.content = null;
   }
}

Shelley.popuphide = function()
{
    try {
	Shelley.update(null);
	Shelley.readyState.terminate();    
    }
    catch (e) {
        Components.utils.reportError(e)
    }
}

// menupopup onpopupshowing="Shelley.popupshow();" onpopuphiding="Shelley.popuphide();"

Shelley.popupshow = function()
{
   if(Shelley.timeout) window.clearTimeout(Shelley.timeout);

   if(!gBrowser) return;
   var thedocshell = gBrowser.selectedBrowser.docShell;
   if(!thedocshell) return;

//	save state
    for (let theval in Shelley.seltabState)
	Shelley.seltabState[theval] = thedocshell[theval];

    try {
//	if(browser) dump("_dvk_dbg_, browser.\n"); _dvk_dbg_
//	if(appcontent) dump("_dvk_dbg_, appcontent.\n");
        var thewintop = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                    .getInterface(Components.interfaces.nsIWebNavigation)
                    .QueryInterface(Components.interfaces.nsIDocShell);
//    dump("_dvk_dbg_, top window:\t"); dump(gBrowser.selectedBrowser.docShell); dump("\n\n"); // _dvk_dbg_
	if(!thewintop) thewintop = thedocshell;

	var thyes = 4;
	var theno = 4;

	for each (let theval in Shelley.item2shell)
	{
	    let thelement = document.getElementById(theval);
//thelement.oncommand = "gFrantShelley[this.value] = !(this.hasAttribute('checked'))";
	    let thecheck = Shelley.seltabState[thelement.value];
	    let theclash = thewintop[thelement.value];
	    if(thelement.value === "allowJavascript")
		theclash = thecheck; // canExecuteScripts makes difference
	    else
		if(theclash) theclash = thecheck; // indeed not clash:-)

	    if(theclash)
	    {
		thelement.removeAttribute("disabled");
		thelement.setAttribute("checked", "true");
		--thyes;
	    }
	    else{
		thelement.setAttribute("disabled", thecheck);
		thelement.removeAttribute("checked");
		--theno; // if disabled then exclude both:
		if(thecheck) --thyes;
	    }
//	    let thestr = "gBrowser.selectedBrowser.docShell[this.value] = " + (!thecheck) + ";";
//	    thelement.setAttribute("oncommand", thestr);
	}
//	dump("_dvk_dbg_, .nsIDocShell:\t"); dump(thedocshell[thattr]); dump("\n");
	if(thedocshell.canExecuteScripts != thedocshell.allowJavascript)
	{
	    if(thedocshell.allowJavascript) --theno
		else --thyes;
	    let thelement = document.getElementById("docShelley-javascript");
	    if(thedocshell.canExecuteScripts)
		    thelement.setAttribute("checked", "true")
		else thelement.removeAttribute("checked");
	    thelement.setAttribute("disabled", "true");
	}

	document.getElementById("docShelley-allowall").setAttribute("disabled", (thyes == 0));
	document.getElementById("docShelley-disallow").setAttribute("disabled", (theno == 0));
    }
    catch (e) {
        Components.utils.reportError(e)
    }

    //	BLOCK services "docShelley-status" menu item
    try {
	let thelement = document.getElementById("docShelley-status");
    //	readystatechange
	Shelley.readyState.initialize(content, thelement);
	Shelley.readyState.update(content.document.readyState);
    }
    catch (e) {
        Components.utils.reportError(e)
    }

    return;
}

   // some handlers of "contentAreaContextMenu.popupshowing"
Shelley.pref2fire = {   // depend on : document, gContextMenu

   'removeImage' : function (e) { // ..frantshelley.removeImage
         document.getElementById("context-removeimage").hidden =
                     !(gContextMenu.onImage && gContextMenu.onLoadedImage);
         document.getElementById("context-setDesktopBackground").hidden = true;
   },

   'sandboxLink' : function (e) { // ..frantshelley.sandboxLink
         document.getElementById("context-openlinksandbox").hidden = !(gContextMenu.onLink)
   },

   'hideSenditem' : function (e) { // ..frantshelley.hideSenditem
      for each (let theval in Shelley.sendy)
          document.getElementById(theval).setAttribute("hidden", "true");
   }
}
// depend on : document, gContextMenu

// main object of ext: load\unload doc', menu.sandboxLink, observe of preference
Shelley.main = {   // var frantShelley = {

  _branch: Components.classes["@mozilla.org/preferences-service;1"].
               getService(Components.interfaces.nsIPrefService).
               getBranch("extensions.frantshelley."),
   _allowPlugins : true,

//   open and return new window, original look in utilityOverlay.js call as openLinkIn
  _openExtraFrame : function (adocOrg, anurl)
  {
     var thewin = window || getTopWin(true);

     var sa = Cc["@mozilla.org/supports-array;1"].createInstance(Ci.nsISupportsArray);
     var wuri = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
          wuri.data = anurl;

     let charset = null;
     if (adocOrg.characterSet) {
          charset = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
          charset.data = "charset=" + adocOrg.characterSet;
     }

     sa.AppendElement(wuri);
     sa.AppendElement(charset);
     //   sa.AppendElement(aReferrerURI); thedoc.referrer; ? documentURIObject
     return Services.ww.openWindow(thewin, getBrowserURL(), null, "chrome,dialog=no,all", sa);
  },
  
//  menuitem id="context-openlinksandbox" oncommand="Shelley.main.sandboxLink(gContextMenu);" 
  sandboxLink : function (aContextMenu) {
    try {
        var neowin = this._openExtraFrame(aContextMenu.target.ownerDocument, aContextMenu.linkURL);
        var thedocshell = neowin.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
               .getInterface(Components.interfaces.nsIWebNavigation)
               .QueryInterface(Components.interfaces.nsIDocShell);
               //   setSandbox : thedocshell.allowSubframes  = false;
        thedocshell.allowJavascript = false;
        thedocshell.allowMetaRedirects= false;
        thedocshell.allowPlugins    = false;
    }
    catch (e) {
          Components.utils.reportError(e)
    }
  },

  startup: function() // Initialize the extension
  {   
//      dump("_dvk_dbg_, startup frant shelly.\n");
//      Services.prefs.addObserver(pref_BlockRefresh, this, false);
      this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
   // this[theval] = this._branch.getBoolPref(theval);
      if(document.loadOverlay)   // xul type
      try {
      // conext menu part
         let thelement = document.getElementById("contentAreaContextMenu");
         for (let thattr in Shelley.pref2fire)
            if(this._branch.getBoolPref(thattr))
               thelement.addEventListener("popupshowing", Shelley.pref2fire[thattr]);
      // command id="Browser:SendLink"
         if(this._branch.getBoolPref("hideSenditem"))
            document.getElementById("Browser:SendLink").setAttribute("disabled", "true");
      // menubar id="main-menubar"
         if(!(this._branch.getBoolPref("showMainmenu")))
            document.getElementById("docShelley-menu").setAttribute("hidden", "true");
      } catch (e) {
         Components.utils.reportError(e)
      }
      
      try {
         this._allowPlugins = this._branch.getBoolPref("allowPlugins");
         Shelley.initialize(this._allowPlugins);
      } catch (e) {
         Components.utils.reportError(e)
      }

      this._branch.addObserver("", this, false);
  },

  getDefPlugins: function()
  {
      return this._allowPlugins;
  },

  observe: function(asubject, atopic, adata)
  {
      if(atopic != "nsPref:changed") return;
      if(!(document.loadOverlay)) return;

      try {

      if(adata in Shelley.pref2fire) // conext menu part
      {
         let thelement = document.getElementById("contentAreaContextMenu");
         if(this._branch.getBoolPref(adata))
            thelement.addEventListener("popupshowing", Shelley.pref2fire[adata]);         
         else {
            thelement.removeEventListener("popupshowing", Shelley.pref2fire[adata]);
            // indiscriminate set overlay items to hidden 
            document.getElementById("context-removeimage").setAttribute("hidden", "true");
            document.getElementById("context-openlinksandbox").setAttribute("hidden", "true");
         }
      }
      else
      if(adata === "showMainmenu") // main menu part
      {
         if(this._branch.getBoolPref("showMainmenu"))
            document.getElementById("docShelley-menu").removeAttribute("hidden");
         else
            document.getElementById("docShelley-menu").setAttribute("hidden", "true");
      }
      else this._allowPlugins = this._branch.getBoolPref("allowPlugins");

      // update always
      if(this._branch.getBoolPref("hideSenditem"))
         document.getElementById("Browser:SendLink").setAttribute("disabled", "true");
      else
         document.getElementById("Browser:SendLink").removeAttribute("disabled");

      } catch (e) {
        Components.utils.reportError(e)
      }

//         dump("_dvk_dbg_, subject:\t"); dump(asubject); dump("\n");
      return;
  },

  shutdown: function()
  {
      this._branch.removeObserver("", this);
//      dump("_dvk_dbg_, shutdown\n");
  },

  handleEvent: function( evt )
  {
        // load/unload the extension
    window.removeEventListener(evt.type, this, false);

    if (evt.type == "load") this.startup();
        else this.shutdown();
  }

};

 window.addEventListener("load", Shelley.main, false);
 window.addEventListener("unload", Shelley.main, false);
