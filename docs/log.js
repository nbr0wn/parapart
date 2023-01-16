
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
// Create Log output area
let logHtml = function (cssClass, ...args) {
    const ln = document.createElement('div');
    if (cssClass) ln.classList.add(cssClass);
    ln.append(document.createTextNode(args.join(' ')));
    document.getElementById('logs').append(ln);
    console.log(args.join(' '));
};

export const log = (...args) => logHtml('', ...args);
export const warn = (...args) => logHtml('warning', ...args);
export const error = (...args) => logHtml('error', ...args);
