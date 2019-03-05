/**
 * Artemisa REST API.
 *
 * REST API script for external communication.
 *
 * @link   https://github.com/DianaLeNeant/ArtemisaNode
 * @author Diana Celeste Nuño Ramírez. 2018.
 */

function secureParse(str) {
    if (!str) return undefined;
    var s = str.replace('\t', '');
    var ret;
    while (s.includes('\t')) {
        s = s.replace('\t', '')
    }
    try {
        ret = JSON.parse(s.replace('\t', ''));
    } catch (error) {
        console.log(error);
        ret = undefined;
    }
    return ret;
}
var address = 'https://artemisa.site:3000/';
var session = null;
function setSession() {
    if(sessionStorage) {
        if (sessionStorage['session']) {
            session = secureParse(sessionStorage['session']);
            if (!session) {
                session = {
                    id: String(fGen()) + String(fGen())
                }
                sessionStorage.setItem('session', JSON.stringify(session));
            }
        } else {
            session = {
                id: String(fGen()) + String(fGen())
            }
            sessionStorage.setItem('session', JSON.stringify(session));
        }
    } else {
        alert('Advertencia: tu navegador no soporta correctamente esta aplicación. Algunos errores podrían presentarse.');
    }
}
setSession();

var lastFRM;

function doResponse(response) {
    if (response == undefined || response == null) return;
    if (response.constructor === String) {
        response = secureParse(response);
        if (!response) {
            return;
        }
    }
    console.log(response);
    
    switch (response.action) {
        case 'redirect':
            window.location = String(response.data.url).replace('https://', 'http://');
            break;
        case 'nothing':
            console.log(`[ nothing to do -> '${response.data}' ]`);
            break;
        default:
            console.log(`[ unrecognized action -> '${response.action}' ]`)
            break;
    }
}
function processFormData(form) {
    var dat = new FormData(form[0]);
    
    dat.append('session', session.id);
    dat.append('origin', window.location.hostname);
    return dat;
}
function sendForm(form, resetf = false) {
    var ret;
    var dat = processFormData(form);
    if (!dat) return;

    if (lastFRM) {
        if (lastFRM == JSON.stringify(dat)) {
            return;
        } else {
            lastFRM = JSON.stringify(dat);
        }
    }

    $.ajax({
        url: address + form.attr("action"),
        type: "POST",
        dataType: "html",
        crossDomain: true,
        data: dat,
        cache: false,
        contentType: false,
        async: false,
        processData: false
        })
        .done(function(rdata) {
            if (resetf) form[0].reset();
            console.log(rdata);
            ret = rdata;
        });
    return ret;
}
function sendData(action, dta) {
    var ret;
    if (dta.constructor === FormData) {
        if (!dta.get('session')) dta.append('session', session.id);
    }
    $.ajax({
        url: address + action,
        type: "POST",
        dataType: "html",
        crossDomain: true,
        data: dta,
        cache: false,
        contentType: false,
        async: false,
        processData: false
        })
        .done(function(rdata){
            ret = rdata;
        });
    return ret;
}

function HTTPGet() {
    var s = window.location.search.split('&');
    var ret = {};

    for (let i = 0; i < s.length; i++) {
        const sa = s[i];
        var s2 = [];
        if (sa.substr(0, 1) == '?') {
            s2 = sa.substring(1, sa.length).split('=');
        } else {
            s2 = sa.split('=');
        }
        ret[s2[0]] = decodeURIComponent(s2[1]);
    }

    return ret;
}

function fGen(random_limit = false) {
    var start = 0;
    var limit = (random_limit ? Math.floor(Math.random() * 10) : 9);
    var ret = '';
    var letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    while (start < limit + 1) {
        if (Math.floor(Math.random() * 2) == 0) {
            ret += letters[Math.floor(Math.random() * 10)]; start++;
        } else {
            ret += Math.floor(Math.random() * 10); start++;
        }
    }
    return String(ret).toUpperCase();
}
function nameGen(random_limit = false) {
    var start = 0;
    var limit = (random_limit ? Math.floor(Math.random() * 10) : 10);
    var ret = '';
    while (start < limit + 1) {
        ret += Math.floor(Math.random() * 10); start++;
    }
    return ret;
}

function bindForms() {
    $('.artemisa').unbind('submit');
    $('.artemisa').on('submit', function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
    
        doResponse(sendForm($(this)));
        console.log('<form sent>');
    });
}
bindForms();
