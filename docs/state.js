
export function writeStateInFragment(state) {
  if(typeof state === "object" && state.id > 0 && state.changed == true ) {
    window.location.hash = encodeURIComponent(JSON.stringify(state));
  }
  else {
    window.location.hash = encodeURIComponent(state.id);
  }
}
export function readStateFromFragment() {
  if (window.location.hash.startsWith('#') && window.location.hash.length > 1) {
    try {
      let state = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
      if( typeof state != 'object' ) {
        let val = parseInt(state);
        if( isNaN(val) ) {
          val = 0;
        }
        state = {
          part :{
            id: val,
            configurator: { },
            changed: false,
          },
          source: {
            name: '',
            content: '',
          },
        };
      }
      console.log("STATE FROM URI: " + JSON.stringify(state));
      return state;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}
