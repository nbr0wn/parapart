
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
// Create Log output area
let logHtml = function (cssClass, ...args) {
    //const ln = document.createElement('div');
    //if (cssClass) ln.classList.add(cssClass);

    let pre = document.getElementById('logpre');
    const tn = document.createTextNode(args.join('\n') + '\n' );
    pre.appendChild(tn);
    //const pre = document.createElement('pre');
    //if (cssClass) pre.classList.add(cssClass);
    //pre.innerHTML += args.join('\n') +  '\n';
    //pre.append(document.createTextNode(args.join('\r\n')));

    //ln.appendChild(pre);
    //document.getElementById('logs').append(pre);

    console.log(args.join(' '));
};

export const log = (...args) => logHtml('', ...args);
export const warn = (...args) => logHtml('text-yellow', ...args);
export const error = (...args) => logHtml('text-red', ...args);
