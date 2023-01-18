
export function writeStateInFragment(state) {
  if(typeof state.customizations != "undefined" ) {
    window.location.hash = encodeURIComponent(JSON.stringify(state.customizations.first));
  }
  else {
    window.location.hash = encodeURIComponent(state.id);
  }
}
export function readStateFromFragment() {
  if (window.location.hash.startsWith('#') && window.location.hash.length > 1) {
    console.log("HAVE HASH");
    try {
      let state = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
      if( typeof state != 'object' ) {
        let val = parseInt(state);
        console.log(val);
        if( isNaN(val) ) {
          val = 0;
        }
        state = {
          part :{
            id: val,
            configurator: { },
          },
          source: {
            name: '',
            content: '',
          },
        };
      }
      console.log("STATE: " + JSON.stringify(state));
      return state;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}
