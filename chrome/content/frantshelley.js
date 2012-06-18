
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

   command: function(event)
      {
      if(gBrowser)
         gBrowser.selectedBrowser.docShell[this.value]
                     = !(Shelley.seltabState[this.value]);
//      dump("_dvk_dbg_, oncmd value:\t"); dump(this.value); dump("\n");
      },

   initialize: function()
      {
      for each (let theval in Shelley.item2shell)
      {
         let thelement = document.getElementById(theval);
         thelement.addEventListener("command", Shelley.command, false);
      }
      if(gBrowser)
         gBrowser.tabContainer.addEventListener("TabOpen",
               function (event) { window.setTimeout(Shelley.propagation, 1, event.target) },
                        false);  
      },

   propagation: function(atarget)
      {
      if(!gBrowser) return;
      if(gBrowser.selectedTab === atarget) return;

         var thedocshell = gBrowser.selectedBrowser.docShell;
         var thebrowser = gBrowser.getBrowserForTab(atarget);
         if(thebrowser)
         for (let theval in Shelley.seltabState)
            if(!(thedocshell[theval]))
               thebrowser.docShell[theval] = false;

      return;
      }
   }
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
Shelley.man = {   // var frantShelley = {

  _branch: Components.classes["@mozilla.org/preferences-service;1"].
               getService(Components.interfaces.nsIPrefService).
               getBranch("extensions.frantshelley."),

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
  
//  menuitem id="context-openlinksandbox" oncommand="Shelley.man.sandboxLink(gContextMenu);" 
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
      var thelement = document.getElementById("contentAreaContextMenu");
      if(thelement && (document.loadOverlay))
      {
         for (let thattr in Shelley.pref2fire)
            if(this._branch.getBoolPref(thattr))
               thelement.addEventListener("popupshowing", Shelley.pref2fire[thattr]);
            
         if(this._branch.getBoolPref("hideSenditem"))
            document.getElementById("Browser:SendLink").setAttribute("disabled", "true");
      }      
      this._branch.addObserver("", this, false);
      
      Shelley.initialize();
  },

  observe: function(asubject, atopic, adata)
  {
      if(atopic != "nsPref:changed") return;
      if(!(document.loadOverlay)) return;

      var thelement = document.getElementById("contentAreaContextMenu");
      if(thelement && (adata in Shelley.pref2fire))
      try {
         
      if(this._branch.getBoolPref(adata))
         thelement.addEventListener("popupshowing", Shelley.pref2fire[adata]);         
      else {
         thelement.removeEventListener("popupshowing", Shelley.pref2fire[adata]);
         // indiscriminate set overlay items to hidden 
         document.getElementById("context-removeimage").setAttribute("hidden", "true");
         document.getElementById("context-openlinksandbox").setAttribute("hidden", "true");
      }
      
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
      dump("_dvk_dbg_, shutdown\n");
  },

  handleEvent: function( evt )
  {
        // load/unload the extension
    window.removeEventListener(evt.type, this, false);

    if (evt.type == "load") this.startup();
        else this.shutdown();
  }

};

// _dvk_dbg_
//   gBrowser.tabContainer.addEventListener("TabSelect", function() { dump("_dvk_dbg, select event.\n") }, false);  
// _dvk_dbg_

 window.addEventListener("load", Shelley.man, false);
 window.addEventListener("unload", Shelley.man, false);
