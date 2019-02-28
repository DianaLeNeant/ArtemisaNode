// default client-side script \ Server Communication Parsing Events

/*          CONTENT RECEPTION
                action:
                    'redirect'    -> ask for a redirection to server
                    'load'        -> load on div
                    'dialog'      -> load on dialog
                    'nothing'     -> put only on console log
                data:
                    {
                        type:
                            'html'      -> load on current content container (dialog or div)
                            'url'       -> load from an url request
                        html:
                            -> html to load on current content container (dialog or div)
                        url:
                            -> url to request data from
                        data:
                            -> post data to attach to requested url
                    }

            SOCKET RESPONSE OBJECT
                definition:
                    -> command to answer
                response: {
                    > parameters object
                }
*/

/**
 * Disabled going back...
 */
history.pushState(null, document.title, location.href);
window.addEventListener('popstate', function (event)
{
  history.pushState(null, document.title, location.href);
});


/**
 * Performs a JSON.parse(str); securely, returning 'undefined' if parsing fails.
 *
 * @param {String} str String to parse.
 */
function secureParse(str) {
    if (!str) return undefined;
    if (str.constructor === Object) return str;
    if (str.constructor !== String) return undefined;
    var s = str.replace('\t', '').replace('\n', '\\n');
    var ret;
    while (s.includes('\t')) {
        s = s.replace('\t', '')
    }
    while (s.includes('\n')) {
        s = s.replace('\n', '\\n')
    }
    try {
        ret = JSON.parse(s.replace('\t', ''));
    } catch (error) {
        ret = undefined;
    }
    return ret;
}

var chats = null;
var session = null;
var fsave = -1;
function setSession() {
    if(sessionStorage) {
        if (sessionStorage['session']) {
            session = secureParse(sessionStorage['session']);
            if (!session) {
                session = {
                    id: String(fGen()) + String(fGen())
                }
                sessionStorage.setItem('session', JSON.stringify(session));
            } /*else {
                if (!window.location.href.includes('user')) {
                    window.location.href = `http://www.artemisa.site:3000/user?s=${session.id}`;
                }
            }*/
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
function isAdmon() {
    return session.info.Acceso.includes('ger') || session.info.Acceso.includes('total') || session.loggedAt == 'sadmon' ||
            session.loggedAt == 'sadmonu' || session.loggedAt == 'sadmonm' || session.loggedAt == 'comm' || session.loggedAt == 'logistics' || session.loggedAt == 'fact' ||
            session.loggedAt == 'sadmong';
}

$.fn.deserialize = function (serializedString)
    {
        var $form = $(this);
        $form[0].reset();
        serializedString = serializedString.replace(/\+/g, '%20');
        var formFieldArray = serializedString.split("&");
        $.each(formFieldArray, function(i, pair){
            var nameValue = pair.split("=");
            var name = decodeURIComponent(nameValue[0]);
            var value = decodeURIComponent(nameValue[1]);
            // Find one or more fields
            var $field = $form.find('[name=' + name + ']');
            console.log(name, value);

            if ($field[0].type == "radio"
                || $field[0].type == "checkbox")
            {
                var $fieldWithValue = $field.filter('[value="' + value + '"]');
                var isFound = ($fieldWithValue.length > 0);
                if (!isFound && value == "on") {
                    $field.first().prop("checked", true);
                } else {
                    $fieldWithValue.prop("checked", isFound);
                }
            } else {
                $field.val(value);
            }
        });
    }
function saveForms() {
    var content = getBodyContent();
    localStorage.clear();
    if (content.find('a.aFormTitle').length > 0) {
        eCount = content.find('a.aFormTitle').length;
        if (eCount > 0) {
            content.find('a.aFormTitle').each(function(index) {
                var tform = $(this).attr('href');
                var tform_content = content.find(tform)[0].innerHTML;

                var tform_serial = content.find(tform).find('form').serialize();
                localStorage.setItem(tform, JSON.stringify([tform_content, tform_serial, $(this).text(), session.info.Usr, session.loggedAt]));
            });
        }
    }
    console.log('[Saved forms...]');
}
function loadForms() {
    var content = getBodyContent();
    for (let x = 0; x < localStorage.length; x++) {
        var tform = secureParse(localStorage[localStorage.key(x)]);
        if (tform[3] == session.info.Usr) {
            //if (tform.length > 4) if (tform[4] != session.loggedAt)
            try {
                if (content.find('a.aFormTitle').find(`[href=${localStorage.key(x)}]`).length == 0) {
                    var fcon = createForm(tform[0], tform[2]);
                    console.log(fcon);
                    try {
                        fcon.find('.options').find('form').deserialize(tform[1]);
                    } catch (error) {

                    }
                }
            } catch (error) {

            }
        }
    }
    if (fsave > -1) window.clearInterval(fsave);
    fsave = window.setInterval(saveForms, 10000);
    bindForm();
    console.log('[forms loaded]');
}
setSession();
var reminders = [];

function getChatWith(cwith, output) {
    var html_r = '';
    commandRequest('getCatL', {T: 'usuarios', C: 'Nombre', I: 'ID'}, function(userR) {
        commandRequest('myChat', {with: cwith }, function(chatR) {
            if (chatR.chat) {
                if (chatR.chat.length > 0) {
                    for (let x = 0; x < chatR.chat.length; x++) {
                        var name = secureParse(userR.result[chatR.chat[x].ChatFrom])[0];
                        html_r += `
                        <p>
                            <strong>${name}</strong> - ${chatR.chat[x].Chat}<br/>
                            <span class="formal">${chatR.chat[x].Time}</span>
                        </p>`;
                    }
                }
            }

            output.html(html_r);
            output.animate({ scrollTop: output.prop("scrollHeight")}, 1000);
        });
    });
}

// Sockets Handling Functions
var socket = io(/*(window.location.href.includes('https') ? 'https://www.artemisa.site:3000' : 'http://www.artemisa.site:3000')*/);
socket.off('notification');
socket.on('notification', function (data) {
    if (data.data.type != undefined) {
        switch (data.data.type) {
            case 'announce':
                var snd = new Audio("notif.wav");
                snd.play();
                createDialog(`<h4>${data.data.title}</h4><p>${data.message}</p>`);
                return;
            break;
            case 'reminder':

                if (data.to.includes(session.info.Usr) && !reminders.includes(data.data.id)) {
                    reminders.push(data.data.id);
                    console.log('reminder!');
                    var snd = new Audio("notif.wav");
                    snd.play();
                    var time = moment(data.data.time);
                    createAskingDialog(`<h4>${data.data.title}</h4>${data.message}<p>A las: ${time.hours() + ':' + time.minutes()}</p><p>¿Apagar alarma?</p>`, function (answer) {
                        if (!answer) {
                            reminders.splice(reminders.indexOf(data.data.id), 1);
                            commandRequest('setNotif', {id: data.data.id});
                        }
                    })
                    return;
                }
            break;
            case 'privatemessage':
                if (!JSON.stringify(data.to).includes('"' + session.info.ID + '"')) return;
                console.log(JSON.stringify(data.to));
                var snd = new Audio("notif.wav");
                snd.play();
                if (chats == null) {
                    chats = {
                        "0": null
                    };
                    remoteFormDialog('chat', function(html_f) {
                        createDialog(html_f, 'Chat', 550, 'auto', false, function(frm) {
                            chats[data.from] = frm;
                            frm.find('[name=with]').val(data.from);

                            getChatWith(data.from, frm.find('.messageLog'));
                        });
                    }, false);
                } else {
                    if (chats[data.from]) {
                        if (!chats[data.from].is(':visible')) {
                            remoteFormDialog('chat', function(html_f) {
                                createDialog(html_f, 'Chat', 550, 'auto', false, function(frm) {
                                    chats[data.from] = frm;
                                    frm.find('[name=with]').val(data.from);

                                    getChatWith(data.from, frm.find('.messageLog'));
                                });
                            }, false);
                        } else {
                            getChatWith(data.from, chats[data.from].find('.messageLog'));
                        }
                    } else {
                        remoteFormDialog('chat', function(html_f) {
                            createDialog(html_f, 'Chat', 550, 'auto', false, function(frm) {
                                chats[data.from] = frm;
                                frm.find('[name=with]').val(data.from);

                                getChatWith(data.from, frm.find('.messageLog'));
                            });
                        }, false);
                    }
                }
            break;
        }
    }

    if (data.to.includes(session.loggedAt)) {
        commandRequest('getCatL', {T: 'usuarios', C: 'Nombre', I: 'ID'}, function (usr) {
            var snd = new Audio("notif.wav");
            snd.play();
            createAskingDialog(`<h3>${secureParse(usr.result[data.from])[0]} envía...</h3><p>${data.message}</p><p>¿Revisar ahora mismo?</p>`, function(res) {
                if (res) {
                    if (data.data.table = 'cmm_ventas') {
                        console.log(data.data.insertId);
                        commandRequest('filter', {nav: 'sales', filter: { column: 'ID', filter: data.data.insertId } }, function(result) {
                            var content = getBodyContent();
                            if (result.obj.command != undefined) {
                                commandRequest(result.obj.command, result.obj.data, function(resC) {
                                    var k = Object.keys(resC);
                                    putOnContent(tableHtmlize(resC[k[0]]));
                                    content.tabs();
                                    loaded();
                                });
                            } else {
                                putOnContent(htmlize(result.obj));
                                content.tabs();
                                loaded();
                            }
                        })
                    } else {
                        commandRequest('document', {table: data.data.table, id: data.data.backtrace.insertId}, function(resZ) {
                            if (resZ.file == null) {
                                createDialog('<p>Documento no encontrado.</p>');
                                return;
                            }
                            download(resZ.file);
                        });
                    }
                }
            });
            delete snd;
        });
    }
});
socket.off('command');
socket.on('command', function (data, fn) {
    console.log(data);
    var content = getBodyContent();

    switch (data.definition) {
        case 'start':
            console.log('[ Connected Successfully ]');
            if ($('body').find(".menu").length > 0) {
                commandRequest('menu', {}, function(answer) {
                    $('body').find(".menu").replaceWith(answer.menu);
                    if ($('body').find(".sessionInfo").length > 0) {
                        commandRequest('myInfo', {}, function(answer) {
                            session.info = answer.info;
                            session.loggedAt = answer.loggedAt;
                            $('body').find(".sessionInfo").html('Ingresó como ' + secureParse(answer.info.Nombre)[0] + ' a ' + answer.loggedAt + '.');
                        });
                    }
                    $('.logout').unbind('click');
                    $('.logout').on('click', function(e) {
                        e.preventDefault();
                        commandRequest('logout', {});
                    });
                    if (getBodyContent()) {
                        loading(function() {
                            commandRequest('home', {}, function(answer) {
                                if (answer.obj.command != undefined) {
                                    commandRequest(answer.obj.command, answer.obj.data, function(resC) {
                                        var k = Object.keys(resC);
                                        if (Array.isArray(resC[k[0]])) {
                                            var tbl = null;
                                            if (answer.obj.command == 'myNotif') {
                                                tbl=tableHtmlize(resC[k[0]].reverse());
                                            } else {
                                                tbl=tableHtmlize(resC[k[0]]);
                                            }
                                            putOnContent(tbl);
                                            content.tabs();
                                            loadForms();
                                            loaded();
                                        } else {
                                            putOnContent(resC[k[0]]);
                                            //content.tabs();
                                            loadForms();
                                            loaded();
                                        }
                                    });
                                } else {
                                    putOnContent(htmlize(answer.obj));
                                    content.tabs();
                                    loadForms();
                                    loaded();
                                }
                            });
                        });
                    }
                })
            }
            if ($('body').find(".news").length > 0) {
                commandRequest('news', {}, function(answer) {
                    $('body').find(".news").html(answer.news);
                })
            }
            if ($('body').find(".area").length > 0) {
                commandRequest('getCat', {
                    T: 'areas',
                    C: 'Nombre',
                    I: 'Sufijo'
                }, function(answer) {
                    for (var i in answer.result) {
                        appendToSelect($('body').find('.area'), answer.result[i].Sufijo, answer.result[i].Nombre);
                    }
                })
            }
        break;

        case 'redir':
            window.location = data.response.url;
        break;

        case 'loadOnContent':
            putOnContent(data.response.html);
        break;

        case 'id':
            fn(session);
        break;

        case 'invalidsession':
            console.log('[ Invalid session alert! ]');
            setSession();
        break;
    }
});
socket.on('disconnect', () =>{ socket.open(); });

/**
 * Sends an instruction to the server and awaits an answer.
 *
 * @param {String} command Instruction for server request.
 * @param {Object} data Instruction parameters.
 * @param {Function} callBack Function to call when the server answers the instruction (if any).
 */
function commandRequest(command, data = {}, callBack = function(answer) {}) {
    var dta  = {
        id: session.id,
        cmd: command,
        par: data
    }
    if (socket.disconnected) {
        socket.open();
    }
    socket.emit('command', dta, function(answer) {
        console.log(answer);
        var p = $("body").find(".loading:visible").find(".l-text");
        if (p.length > 0 && answer.html != undefined) {
            var q = p.append('<p class="keepw">Seguimos trabajando...</p>');
            q.show("fold", 1000, function() {
                callBack(answer);
            });
        } else {
            callBack(answer);
        }
    });
}

// Client-side Handling Functions
$( function() {
    bindForm();
});
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
function qrGen(data) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

    var qr = qrcode(0, 'H');
    qr.addData(data, 'Byte');
    qr.make();

    return qr.createImgTag(4);
}

/**
 * Starts the product properties modification wizard.
 *
 * @param {jquery} item <tr> element to process.
 * @param {Boolean} perm Wether to perform the product modification with administrative permissions or not.
 */
function productProperties (item, perm = false) {
    if (item.closest('.tblItems').length < 1) return;
    if (!session.loggedAt.includes('sales') && !session.loggedAt.includes('meison') && !session.loggedAt.includes('sadmon')) {
        var modHTML = `
        <select name="status">
            <option>CANCELADO</option>
            <option>DETENIDO</option>
            <option>EN ALMACEN</option>
            <option>EN FABRICACION</option>
            <option>EN OFICINA</option>
            <option>EMBARCADO</option>
            <option>ENTREGADO</option>
            <option>LISTO, RECOGER</option>
            <option>NO HAY EN EXITENCIA</option>
            <option>PENDIENTE PAGO</option>
            <option>SIN EXISTENCIAS</option>
            <option>ENVIADO AL CLIENTE</option>
            <option>POR LLEGAR A ALMACEN</option>
        </select>`;
        createFormDialog(modHTML, function(res) {
            var nst = res.get('status');
            item.attr('title', nst);
        });
    } else {
        var modHTML = '';
        var tiva = item.find('.iva').html();
        var tpr = Number(item.find('.price').html());
        var tqn = Number(item.find('.qnt').html());
        if (item.find('.qnt').length > 0) {
            modHTML += `Cantidad: <input type="text" name="newqn" placeholder="Nueva cantidad" value="${tqn}" class="numeric" />`;
        }
        if (item.find('.price').length > 0) {
            modHTML += `Precio: <input type="text" name="newpr" placeholder="Nuevo precio" value="${tpr}" />`;
        }
        if (item.find('.iva').length > 0) {
            modHTML += `¿Lleva IVA?<input type="checkbox" name="newiva" ${(tiva == 'on' || tiva == '1' ? 'checked' : '')} />`;
        }

        createFormDialog(modHTML, function(res) {
            var npr = res.get('newpr');
            var niv = res.get('newiva');
            var nqn = res.get('newqn');

            if (npr.includes('%')) {
                if (!item.hasClass('admon') && !perm) {
                    permissionDialog(function(permited) {
                        if (permited || npr.includes('+')) {
                            var dscA = '0.' + String(npr.substring(0, npr.indexOf('%'))).replace('-', '').replace('+', '');
                            var dsc = tpr * parseFloat(dscA);

                            switch (npr.slice(0, 1)) {
                                case '-': npr = (tpr - dsc).toFixed(2); break;
                                case '+': npr = (tpr + dsc).toFixed(2); break;
                                default: npr = (tpr + dsc).toFixed(2); break;

                            }

                            item.find('.price').html(String(npr));
                            item.find('.iva').html(niv);
                            item.find('.qnt').html(String(nqn));
                        } else {
                            createDialog('Permiso denegado.')
                        }
                    });
                } else {
                    var dscA = '0.' + String(npr.substring(0, npr.indexOf('%')))
                    var dsc = tpr * parseFloat(dscA);
                    npr = (tpr - dsc).toFixed(2);

                    item.find('.price').html(String(npr));
                    item.find('.iva').html(niv);
                    item.find('.qnt').html(String(nqn));
                }
            } else {
                if (npr < tpr && !perm) {
                    permissionDialog(function(permited) {
                        if (permited) {
                            item.find('.price').html(String(npr));
                            item.find('.iva').html(niv);
                            item.find('.qnt').html(String(nqn));
                        } else {
                            createDialog('Permiso denegado.')
                        }
                    });
                } else {
                    item.find('.price').html(String(npr));
                    item.find('.iva').html(niv);
                    item.find('.qnt').html(String(nqn));
                }
            }
        });
    }
}
/**
 * Starts the quote modification wizard to the specified quote ID from the Database.
 *
 * @param {Number} id Database ID of the desired element to modify.
 * @param {Boolean} admon Wether to perform the modification with administrative permissions or not.
 */
function askFromQuery(id, admon = false) {
    remoteFormDialog('newAsk', function (html_f) {
        commandRequest('getCatL', { T: 'cmm_clientes', C: 'Nombre', I: 'ID'}, function(resCat) {
            commandRequest('query', {table: 'cmm_cotizaciones', id: id}, function(result) {
                if(!result.res) return;
                var fCon = createForm(html_f, resCat.result[result.res.Cliente] + ' (Cotización)');
                var table = tableHtmlize(secureParse(result.res.Productos));
                $(table).find('tr').each(function() {
                    var toadd = $(this);
                    toadd.addClass('item result productItem');
                    $(toadd.find('td')[4]).addClass('price');
                    $(toadd.find('td')[5]).addClass('iva');
                    $(toadd.find('td')[6]).addClass('qnt');
                    var itm = fCon.find('.items').find('.tblItems').append(toadd);
                });
                fCon.find('.options').find('[name=logo]').val(result.res.Logo);
                fCon.find('.options').find('[name=client]').val(result.res.Cliente);
                fCon.find('.options').find('[name=sdate]').val(dateSQL(new Date(result.res.Fecha)));
                fCon.find('.options').find('[name=notes]').text(result.res.Notas);
                fCon.find('.options').find('[name=intern]').text(result.res.Interno);
                fCon.find('.options').find('[name=arr]').val(result.res.Arrendadora);
                if (admon) {
                    fCon.find('form').append(`<select name="estado" class="dcat">{cmm_ventaEstados:Nombre:ID}</select>`);
                    if (session.loggedAt == 'logistics') fCon.find('form').append(`<input type="text" name="guia" placeholder="Número de Guía" value="${result.res.Guia != null ? result.res.Guia : ''}" />`);
                    dCat(fCon.find('form'), function() {
                        fCon.find('.options').find('[name=estado]').val(result.res.Estado);
                    })
                }
                fCon.find('form').append(`<input type="hidden" name="ID" value="${result.res.ID}" />`)
                bindForm();
            });
        });
    }, false);
}
/**
 * Starts the sale modification wizard to the specified sale ID from the Database.
 *
 * @param {Number} id Database ID of the desired element to modify.
 * @param {Boolean} admon Wether to perform the modification with administrative permissions or not.
 */
function saleFromQuery(id, admon = false) {
    remoteFormDialog('newSale', function (html_f) {
        commandRequest('getCatL', {T: 'cmm_clientes', C: 'Nombre', I: 'ID'}, function(resCat) {
        commandRequest('getCatL', {T: 'cmm_ventaPrioridades', C: 'Clase', I: 'ID'}, function(resPri) {
            commandRequest('query', {table: 'cmm_ventas', id: id}, function(result) {
                if(!result.res) return;
                var fCon = createForm(html_f, resCat.result[result.res.Cliente] + ' (Venta)');
                var table = tableHtmlize(secureParse(result.res.Productos));
                $(table).find('tr').each(function() {
                    var toadd = $(this);
                    toadd.addClass('item result productItem');
                    $(toadd.find('td')[4]).addClass('price');
                    $(toadd.find('td')[5]).addClass('iva');
                    $(toadd.find('td')[6]).addClass('qnt');
                    var itm = fCon.find('.items').find('.tblItems').append(toadd);
                });
                if (!session.loggedAt.includes('sales') && !session.loggedAt.includes('meison')) {
                    commandRequest('query', {table: 'cmm_clientes', id: result.res.Cliente}, function(resultClient) {
                        fCon.find('.options').find('[name=client]')[0].outerHTML = `<input type="hidden" name="client" value="${resultClient.res.ID}" />`;

                        delete resultClient.res.ID;
                        delete resultClient.res.Categoria;
                        delete resultClient.res.Subcategoria;
                        delete resultClient.res.Ejecutivo;
                        delete resultClient.res.Seguimiento;
                        delete resultClient.res.Tags;

                        var nResC = {
                            '': '<section class="title-red"><h4>Datos de Facturación</h4></section>',
                            'Razón Social': resultClient.res.RazonSocial,
                            'RFC': resultClient.res.RFC,
                            'Domicilio': resultClient.res.Domicilio,
                            'Ciudad / Colonia': resultClient.res.Ciudad,
                            'Municipio': resultClient.res.Municipio,
                            'Estado': resultClient.res.Estado,
                            'Código Postal': resultClient.res.CP,
                            'Correo Electrónico': resultClient.res.Correo,
                            'Teléfono': resultClient.res.Telefono,

                            ' ': '<section class="title-green"><h4>Datos de Envío / Personales</h4></section>',
                            'Nombre': resultClient.res.Nombre,
                            'Domicilio ': resultClient.res.CDomicilio,
                            'Ciudad / Colonia ': resultClient.res.CCiudad,
                            'Municipio ': resultClient.res.CMunicipio,
                            'Estado ': resultClient.res.CEstado,
                            'Código Postal ': resultClient.res.CCP,
                            'Correo Electrónico ': resultClient.res.CCorreo,
                            'Teléfono ': resultClient.res.CTelefono,
                            'Referencias': resultClient.res.Notas
                        }

                        var ctable = tableHtmlize(nResC);
                        var tblStr = '<h3>Información del cliente:</h3><p>' + String(ctable) + '</p>'

                        try {
                            var tblO = fCon.find('.items').append(tblStr).find('table').not('.tblItems');
                            transtable(tblO);
                        } catch (error) {
                            console.log(error);
                        }

                        commandRequest('document', {table: 'cmm_ventas', id: id}, function(resD) {
                            if (resD.file == null) {
                                createDialog('<p>Venta sin remisión válida.</p>');
                                return;
                            }
                            fCon.find('.items').append('<h3>Nota de remisión</h3><canvas id="pdfCanvas" style="border:1px  solid black"></canvas>');
                            insertPDF(resD.file, fCon.find('.items').find('canvas')[0]);
                            console.log('pdf inserted?');
                        });

                    });
                    fCon.find('.options').find(':button[value^=Crear]').remove();
                    fCon.find('.options').find(':button[value^=Modificar]').remove();
                    fCon.find('.options').find('[for=client]').remove();
                }
                fCon.find('.options').find('[name=logo]').val(result.res.Logo);
                if (session.loggedAt.includes('sales') || session.loggedAt.includes('meison')) fCon.find('.options').find('[name=client]').val(result.res.Cliente);
                fCon.find('.options').find('[name=sdate]').val(dateSQL(new Date(result.res.Fecha)));
                fCon.find('.options').find('[name=notes]').text(result.res.Notas);
                var sp = secureParse(result.res.Interno);
                if (sp) {
                    fCon.find('.options').find('[name=intern]').append($(tableHtmlize(sp)).find('tr'));
                }
                fCon.find('.options').find('[name=cfdi]').val(result.res.CFDI);
                fCon.find('.options').find('[name=mpay]').val(result.res.MPAY);
                fCon.find('.options').find('[name=fpay]').val(result.res.FPAY);
                fCon.find('.options').find('[name=arr]').val(result.res.Arrendadora);
                fCon.find('.options').find('[name=paq]').val(result.res.Paqueteria);
                if (admon) {
                    fCon.find('form').append(`<label>Estado de venta:</label><select name="estado" class="dcat" value="${result.res.Estado}">{cmm_ventaEstados:Nombre:ID}</select>`);
                    if (session.loggedAt == 'logistics') fCon.find('form').append(`<input type="text" name="guia" placeholder="Número de Guía" value="${result.res.Guia != null ? result.res.Guia : ''}" />`);

                    fCon.find('form').append(`<label>Prioridad:</label><select name="prioridad" class="dcat">{cmm_ventaPrioridades:Nombre:ID}</select>`);

                    dCat(fCon.find('form'), function() {
                        fCon.find('.options').find('[name=estado]').val(result.res.Estado);
                        fCon.find('.options').find('[name=prioridad]').val(result.res.Prioridad);
                    })
                }
                fCon.find('form').append(`<input type="hidden" name="ID" value="${result.res.ID}" />`)
                bindForm();
            });
            });
        });
    }, false);
}

/**
 * Creates a form dialog to create a new form with the specified options.
 *
 * @param {Array} options Array of objects containing 'title' and 'form' attributes.
 * @param {jquery} item jQuery representation of the selected item.
 */
function createFormDialogEx(options, item) {
    var html_r = '<input type="text" name="formName" placeholder="Nombre del formulario" class="form-control" />';
    if (options.length > 1) {
        html_r += `<select name="formType" class="form-control">`;
        for (let i = 0; i < options.length; i++) {
            html_r += `<option>${options[i].title}</option>`;
        }
        html_r += '</select>';
    } else if (options.length == 1) {
        html_r += `<input type="hidden" name="formType" value="${options[0].title}">`;
    }

    createFormDialog(html_r, function(res) {
        if (!res) return;
        var name = res.get('formName');
        var type = res.get('formType');
        var addForm = function(html_f) {
            var fCon = createForm(html_f, name + ` (${type})`);
            if (item) {
                var clon = item.clone();
                var lcln = clon.find('td');
                if (!lcln[lcln.length - 1].classList.contains('qnt')) clon.append('<td class="qnt">1</td>');
                clon.appendTo(fCon.find('.items').find('.tblItems'));
            }
            try {
                $('.saleid').text($('.saleid').text() + item.find('td')[0].innerText);
                $('input[name=venta]').val(item.find('td')[0].innerText);
            } catch (error) {
                console.log('Caugth: ' + error);
            }
            bindForm();
        }

        for (let x = 0; x < options.length; x++) {
            if (String(options[x].title) == String(type)) {
                remoteFormDialog(options[x].form, addForm, false);
            }
        }
    });
}

/**
 * Process the context menu clicked option.
 *
 * @param {jquery} item Item to apply the selected context menu option.
 * @param {String} cmd Context menu command.
 */
function processContext(item, cmd) {
    var content = getBodyContent();
    if (!content) return false;

    var dwnDocument = function() {
        var table = '';
        if (item.hasClass('saleItem')) {
            table = 'cmm_ventas';
        }
        if (item.hasClass('askItem')) {
            table = 'cmm_cotizaciones';
        }
        if (table == '') return;

        commandRequest('document', {table: table, id: item.find('td')[0].innerText}, function(resZ) {
            if (resZ.file == null) {
                createDialog('<p>Documento no encontrado.</p>');
                return;
            }
            download(resZ.file);
        });
    }

    var creProduct = function() {
        createFormDialogEx([
            {
                title: 'Venta',
                form: 'newSale'
            },
            {
                title: 'Cotización',
                form: 'newAsk'
            }
        ], item);
    }
    var modProduct = function () {
        if (item.hasClass('comm')) {
            remoteEditForm('editProduct', {table: 'cmm_productos', id: item.find('td')[0].innerText}, item, ['ID', 'Clave', 'Marca', 'Descripcion', 'VentaCC', 'IVA']);
        } else {
            productProperties(item);
        }
    }
    var notifItem = function() {
        var table = '';
        if (item.hasClass('saleItem')) {
            table = 'cmm_ventas';
        }
        if (table == '') return;
        if (isAdmon()) return;
        remoteFormDialog('emitNotification',
            function(data) {
                var answer = sendData('createNotif', data);
                doResponse(answer);
            }, true,
            function (process) {
                process.find('[name=ID]').val(item.find('td')[0].innerText);
                process.find('[name=table]').val(table);
            }
        );
    }
    var modSale = function() {
        if (!isAdmon()) {
            createDialog('<p>Para modificar una venta ya realizada, ponte en contacto con tu administrador de ventas.</p>');
        } else {
            saleFromQuery(item.find('td')[0].innerText, (isAdmon() || item.hasClass('admon') || item.hasClass('sadmon')));
        }
    }
    var modAsk = function() {
        askFromQuery(item.find('td')[0].innerText, (item.hasClass('admon') || item.hasClass('sadmon')));
    }
    var modClient = function() {
        remoteEditForm('editClient', {table: 'cmm_clientes', id: item.find('td')[0].innerText}, item, ['ID', 'RazonSocial', 'RFC', 'Domicilio', 'Ciudad', 'Municipio', 'Estado', 'CP', 'Correo', 'Telefono', 'Nombre', 'CDomicilio', 'CCiudad', 'CMunicipio', 'CEstado', 'CCP', 'CCorreo', 'CTelefono', 'Categoria', 'Subcategoria', 'Notas']);
    }
    var creBio = function() {
        if (!session.loggedAt == 'logistics' || !session.loggedAt == 'biomed') return;

        createFormDialogEx([
            {
                title: 'Revisión biomédica',
                form: 'newBioRev'
            }
        ], item);
    }
    var creStor = function() {
        if (!session.loggedAt == 'store' || !session.loggedAt == 'logistics') return;

        createFormDialogEx([
            {
                title: 'Salida de almacén',
                form: 'newStoreOut'
            }
        ], item);
    }
    var modBio = function() {
        remoteEditForm('editBioRev', {table: 'cmm_biomedica', id: item.find('td')[0].innerText});
    }
    var modChi = function() {
        remoteEditForm('newBioChison', {table: 'bio_chison', id: item.find('td')[0].innerText});
    }

    var modInc = function() {
        remoteEditForm('editInc', {table: 'faltas', id: item.find('td')[0].innerText});
    }
    var modEmpl = function() {
        remoteEditForm('editEmpl', {table: 'empleados', id: item.find('td')[0].innerText});
    }
    var modTel = function() {
        remoteEditForm('newTel', {table: 'telefonos', id: item.find('td')[0].innerText});
    }
    var modVaca = function() {
        remoteEditForm('newVacation', {table: 'vacaciones', id: item.find('td')[0].innerText});
    }

    var newProduct = function(tableObject) {
        var html_f = `<input type="text" name="clave" placeholder="Clave de producto" />
                    <input type="text" name="marca" placeholder="Marca de producto" />
                    <select name="descrl">
                        <option>Personalizado</option>
                        <option>Gastos de envío</option>
                        <option>Gastos de capacitación</option>
                    </select>
                    <textarea name="descr" placeholder="Descripción del producto"></textarea>
                    <input type="text" name="preci" placeholder="Precio" />`;
        createFormDialog(html_f, function(result) {
            var key = result.get('clave');
            var bra = result.get('marca');
            var dsc = result.get('descr');
            var pri = result.get('preci');
            var dsl = result.get('descrl');

            tableObject.append(
                `<tr class="item result productItem">
                    <td class="item result productItem">~</td>
                    <td class="item result productItem">${key}</td>
                    <td class="item result productItem">${bra}</td>
                    <td class="item result productItem">${dsc}</td>
                    <td class="item result productItem price">${pri}</td>
                    <td class="item result productItem iva">0</td>
                    <td class="item result productItem qnt">1</td>
                </tr>`
                );
        }, 'Agregar producto extraordinario', function(d) {
            d.find('[name=descrl]').on('change', function() {
                if ($(this).val() != 'Personalizado') {
                    d.find('[name=descr]').val($(this).val())
                    d.find('[name=descr]').hide(1000);
                } else {
                    d.find('[name=descr]').val('');
                    d.find('[name=descr]').show(1000);
                }
            })
        });
    }

    switch (cmd) {
        case 'doc':
            dwnDocument();
        break;
        case "add":
            var html_r = '<p>Seleccione un formulario.</p><select name="formTo" class="form-control">';
            var eCount = 0;
            if (content.find('a.aFormTitle').length > 0) {
                eCount = content.find('a.aFormTitle').length;
                if (eCount > 1) {
                    content.find('a.aFormTitle').each(function(index) {
                        if (!html_r.includes($(this).attr('href'))) html_r += `<option value="${$(this).attr('href')}">${$(this).text()}</option>`;
                    });
                } else {
                    html_r += `<option value="${content.find('a.aFormTitle').attr('href')}">${content.find('a.aFormTitle').text()}</option>`;
                }
            }
            if (eCount == 0) {
                createDialog("No hay formularios creados actualmente.");
                return false;
            }
            html_r += '</select>';
            createFormDialog(html_r, function(res) {
                if (!res) return;
                var f = res.get('formTo');
                if (f != undefined) {
                    var clon = item.clone();
                    var lcln = clon.find('td');
                    if(clon.hasClass('productItem')) if (!lcln[lcln.length - 1].classList.contains('qnt')) clon.append('<td class="qnt">1</td>');
                    clon.appendTo(content.find(f).find('.tblItems'));
                }
            });
            break;

        case "cre":
            if (item.hasClass('productItem')) { creProduct() }
            if (item.hasClass('bioSaleItem')) { creBio() }
            if (item.hasClass('saleItem')) { creBio() }
            break;

        case 'rev':
            var container = item.closest('.tblItems');
            if (container.length > 0) {
                item.remove();
            }
            break;

        case 'mod':
            if (item.hasClass('productItem')) { modProduct() }
            if (item.hasClass('saleItem')) { modSale() }
            if (item.hasClass('askItem')) { modAsk() }
            if (item.hasClass('clientItem')) { modClient() }
            if (item.hasClass('bioRevItem')) { modBio() }
            if (item.hasClass('bioChisonItem')) { modChi() }
            if (item.hasClass('incidItem')) { modInc() }
            if (item.hasClass('emplItem') && item.hasClass('admon')) { modEmpl() }
            if (item.hasClass('telItem') && item.hasClass('admon')) { modTel() }
            if (item.hasClass('vacaItem')) { modVaca() }
            break;
        case 'notf':
            notifItem();
            break;
        case 'delF':
            if (item.hasClass('aFormTitle')) {
                var id = item.attr('href').replace('#', '');
                var div = $(getBodyContent()).find(`div[id=${id}]`);
                if (id != undefined && div != undefined) {
                    div.remove();
                    item.remove();
                }
            }
            break;
        case 'modF':
            if (item.hasClass('aFormTitle')) {
                var html_r = '<input type="text" name="formName" placeholder="Nombre del formulario" class="form-control" />';
                createFormDialog(html_r, function(res) {
                    var ttxt = item.text();

                    item.text(ttxt.replace(ttxt.substring(0, ttxt.indexOf(' (')), res.get('formName')));
                });
            }
            break;
        case 'newV':
            var id = item.attr('href').replace('#', '');
            var div = $(getBodyContent()).find(`div[id=${id}]`);
            var tbl = div.find('.items').find('.tblItems');
            if (tbl.length > 0) {
                var trs = tbl.find('tr');
                if (trs.length > 0) {
                    if (trs[trs.length - 1].classList.contains('productItem') || item[0].innerText.includes('Cotización') || item[0].innerText.includes('Venta')) {
                        newProduct(tbl);
                    }
                }
            }
            break;
    }
}
/**
 * Process HTTP Post response data objects.
 *
 * Process HTTP Post responses from server, takes one argument with the server response object.
 *
 * @param {Object} response HTTP Post response data object.
 */
function doResponse(response) {
    if (response == undefined || response == null) return;
    if (response.constructor === String) {
        response = secureParse(response);
        if (!response) {
            return;
        }
    }
    console.log(response);
    if (response.data != undefined) {
        if (response.data.file != undefined) {
            if (response.data.file == null) {
                createDialog('<p>Documento no encontrado.</p>');
                return;
            }
            download(response.data.file);
        }
    } else {
        if (response.file != undefined) {
            if (response.file == null) {
                createDialog('<p>Documento no encontrado.</p>');
                return;
            }
            download(response.file);
        }
    }
    switch (response.action) {
        case 'redirect':
            window.location = response.data.url;
            break;
        case 'load':
            switch (response.data.type) {
                case 'html':
                    putOnContent(response.data.html);
                    break;
                case 'url':
                    loadOnContent(response.data.url, response.data.data);
                    break;
            }
            break;
        case 'dialog':
            switch (response.data.type) {
                case 'html':
                    createDialog(response.data.html, 'Artemisa', 550, 'auto', false, function(frm) {
                        if (frm.find('[name=with]').length > 0) {
                            if (chats == null) {
                                chats = {
                                    "0": null
                                };
                            }
                            chats[frm.find('[name=with]').val()] = frm;
                        }
                    });
                    break;
                case 'url':
                    loadOnDialog(response.data.url);
                    break;
            }
            break;
        case 'nothing':
            console.log(`[ nothing to do -> '${response.data}' ]`);
            break;
        default:
            console.log(`[ unrecognized action -> '${response.action}' ]`)
            break;
    }
}
/**
 * Adds the default css classes to all the input fields in the document.
 */
function processInputs() {
    $('input,textarea,select,checkbox,radio,button').addClass('form-control');
    $('[title]').attr('data-toggle', 'tooltip').attr("data-placement", "right");
    $(".required").attr("title", "Campo requerido.").attr("data-toggle", "tooltip").attr("data-placement", "right");
    $('[data-toggle="tooltip"]').tooltip();
}
function bindOnDialog() {
    $('.onDialog').unbind('click');
    $('.onDialog').on('click', function(event) {
        if ($(this).attr('href').toLowerCase().match(/\.(jpeg|jpg|gif|png)$/)) {
            event.preventDefault();
            event.stopPropagation();
            createDialog(`<img class="maxx" src="${$(this).attr('href')}" />`);
        } else if ($(this).attr('href').toLowerCase().match(/\.(pdf)$/)){
            event.preventDefault();
            event.stopPropagation();
            var pdfU = $(this).attr('href');
            createDialog(`<canvas id="pdfCanvas" style="border:1px  solid black">`, 'Visualizar PDF', 825, 'auto', false, function(d) {
                d.append('<a href="' + pdfU + '" target="_blank">Descargar</a>');
                insertPDF(pdfU, d.find('canvas')[0]);
            });
        } else {
            console.log('Unsuported frame construction.');
            download($(this).attr('href'));
        }
    });
}
/**
 * Applies the default dynamic behaviour to all the elements in the document.
 */
function bindForm(caller) {

    bind_eTables();
    applyDynForm();
    bindSeekers();
    processInputs();
    bindOnDialog();

    $('.noFact').unbind('click');
    $('.noFact').click(function() {
        console.log('No fact?');
        if ($(this).next().is(':visible')) {
            $(this).next().hide(1000);
            $(this).next().find('input').val('NO REQUIERE FACTURA');
            $(this).val('No requiere factura');
        } else {
            $(this).next().find('input').val('');
            $(this).next().show(1000);
            $(this).val('Sí requiere factura');
        }
    });

    $('.numeric, .telephone, .rfc, .nss, .curp, .card').each(function() {
        try {
            if ($(this).hasClass('numeric')) {
                var nums = new Cleave($(this), {
                    numeral: true,
                    stripLeadingZeroes: false,
                    numeralThousandsGroupStyle: 'none',
                    numeralPositiveOnly: true
                });
            }
            if ($(this).hasClass('telephone')) {
                var tels = new Cleave($(this), {
                    phone: true,
                    phoneRegionCode: 'MX'
                });
            }
            if ($(this).hasClass('rfc')) {
                var rfcs = new Cleave($(this), {
                    blocks: [4, 6, 3],
                    delimiter: '-',
                    uppercase: true
                });
            }
            if ($(this).hasClass('nss')) {
                var nsss = new Cleave($(this), {
                    blocks: [2, 3, 3, 3],
                    delimiter: ' ',
                    uppercase: true
                });
            }
            if ($(this).hasClass('curp')) {
                var curps = new Cleave($(this), {
                    blocks: [4, 6, 6, 2],
                    delimiter: ' ',
                    uppercase: true
                });
            }
            if ($(this).hasClass('card')) {
                var cards = new Cleave($(this), {
                    creditCard: true
                });
            }
        } catch (error) {
            console.log(error);
        }
    });

    $('form').attr('enctype', 'multipart/form-data');

    $(document).keydown(function(e) {
        if (e.ctrlKey) {
          if (e.keyCode == 65 || e.keyCode == 97) { // 'A' or 'a'
            e.preventDefault();
            if ($('.treeView').length > 0) {
                $('.treeView').jstree("deselect_all");
                var node = $('.treeView').jstree(true).get_node('#');
                for (var c = 0; c < node.children.length; c++) {
                    $('.treeView').jstree(true).select_node(node.children[c]);
                }
            }
          }
        }
      });

    $('form').unbind('submit');
    $('form').on('submit', function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if ($(this).attr('data-kind') == 'skip') return;

        var response = sendForm( $(this) );
        doResponse(response);

        return false;
    });
    $('.askfor').unbind('click');
    $('.askfor').on('click', function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        var content = getBodyContent();
        var href = $(this).attr('href');
        var lTitle = $(this).text();
        loading(function() {
            commandRequest('nav', {nav: href}, function(result) {
                if (result.obj.command != undefined) {
                    commandRequest(result.obj.command, result.obj.data, function(resC) {
                        var k = Object.keys(resC);
                        if (Array.isArray(resC[k[0]])) {
                            var tbl = null;
                            if (result.obj.command == 'myNotif') {
                                tbl=tableHtmlize(resC[k[0]].reverse());
                            } else {
                                tbl=tableHtmlize(resC[k[0]]);
                            }
                            putOnContent(tbl, lTitle);
                            content.tabs();
                            loaded();
                        } else {
                            putOnContent(resC[k[0]], lTitle);
                            //content.tabs();
                            loaded();
                        }
                    });
                } else {
                    putOnContent(htmlize(result.obj), lTitle);
                    content.tabs();
                    loaded();
                }
            })
        });
    });

    $(document).contextmenu({
        delegate: ".item",
        menu: [
            {title: "Agregar a formulario existente", cmd: "add", uiIcon: "ui-icon-circle-plus"},
            {title: "Agregar a nuevo formulario", cmd: "cre", uiIcon: "ui-icon-document"},
            {title: "Eliminar de la lista", cmd: "rev", uiIcon: "ui-icon ui-icon-arrowreturnthick-1-w"},
            {title: "----"},
            {title: "Modificar", cmd: "mod", uiIcon: "ui-icon-pencil"},
            {title: "Notificar", cmd: "notf", uiIcon: "ui-icon-info"},
            {title: "Descargar documento", cmd: "doc", uiIcon: "ui-icon-print"}
            ],
        select: function(event, ui) {
            processContext($(ui.target.closest('tr')[0]), ui.cmd);
        }
    });
    $(getBodyContent()).contextmenu({
        delegate: ".aFormTitle",
        menu: [
            {title: "Eliminar formulario", cmd: "delF", uiIcon: "ui-icon-close"},
            {title: "Modificar título", cmd: "modF", uiIcon: "ui-icon-pencil"},
            {title: 'Nuevo elemento sin categoría', cmd: 'newV', uiIcon: 'ui-icon-lightbulb'}
            ],
        select: function(event, ui) {
            processContext(ui.target, ui.cmd);
        }
    });

    $('.action').unbind('click');
    $('.action').on('click', function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        var caller = $(this);
        var val = $(this).attr('data-action').split('.');
        switch (val[0]) {
            case 'form':
                remoteFormDialog(val[1], function (answer) {
                    var response = sendData(val[1], answer);
                    doResponse(response);
                }, function() {
                    bindForm();
                });
            break;
            case 'newForm':
                createFormDialogEx([
                    {
                        title: 'Venta',
                        form: 'newSale'
                    } ,
                    {
                        title: 'Cotización',
                        form: 'newAsk'
                    }
                ], null)
            break;
            case 'dateFilter':
                createFormDialog('<input type="date" name="sdate" /><input type="date" name="edate" />', function(ares) {
                    var sdate = ares.get('sdate');
                    var edate = ares.get('edate');
                    var content = getBodyContent();
                    var href = val[1];
                    loading(function() {
                        commandRequest('filter', {nav: href, filter: { column: val[2], filter: sdate + "' AND '" + edate } }, function(result) {
                            if (result.obj.command != undefined) {
                                commandRequest(result.obj.command, result.obj.data, function(resC) {
                                    var k = Object.keys(resC);
                                    putOnContent(tableHtmlize(resC[k[0]]));
                                    content.tabs();
                                    loaded();
                                });
                            } else {
                                putOnContent(htmlize(result.obj));
                                content.tabs();
                                loaded();
                            }
                        })
                    });
                });
            break;
            case 'dateTimeFilter':
                createFormDialog('<input type="date" name="sdate" /><input type="date" name="edate" />', function(ares) {
                    var sdate = ares.get('sdate');
                    var edate = ares.get('edate');
                    var content = getBodyContent();
                    var href = val[1];
                    loading(function() {
                        commandRequest('filter', {nav: href, filter: { column: val[2], filter: sdate + " 00:00:00' AND '" + edate + " 23:59:00" } }, function(result) {
                            if (result.obj.command != undefined) {
                                commandRequest(result.obj.command, result.obj.data, function(resC) {
                                    var k = Object.keys(resC);
                                    putOnContent(tableHtmlize(resC[k[0]]));
                                    content.tabs();
                                    loaded();
                                });
                            } else {
                                putOnContent(htmlize(result.obj));
                                content.tabs();
                                loaded();
                            }
                        })
                    });
                });
            break;
            case 'bFilter':
                createFormDialog('<input type="text" name="fil" />', function(ares) {
                    var bra = ares.get('fil');
                    var content = getBodyContent();
                    var href = val[1];
                    loading(function() {
                        commandRequest('filter', {nav: href, filter: { column: val[2], filter: bra } }, function(result) {
                            if (result.obj.command != undefined) {
                                commandRequest(result.obj.command, result.obj.data, function(resC) {
                                    var k = Object.keys(resC);
                                    putOnContent(tableHtmlize(resC[k[0]]));
                                    content.tabs();
                                    loaded();
                                });
                            } else {
                                putOnContent(htmlize(result.obj));
                                content.tabs();
                                loaded();
                            }
                        })
                    });
                });
            break;
            case 'filter':
                var content = getBodyContent();
                loading(function() {
                    commandRequest('filter', {nav: val[3], filter: { column: val[1], filter: val[2] } }, function(result) {
                        if (result.obj.command != undefined) {
                            commandRequest(result.obj.command, result.obj.data, function(resC) {
                                var k = Object.keys(resC);
                                putOnContent(tableHtmlize(resC[k[0]]));
                                content.tabs();
                                loaded();
                            });
                        } else {
                            putOnContent(htmlize(result.obj));
                            content.tabs();
                            loaded();
                        }
                    })
                });
            break;
            case 'formcon':
                commandRequest('getCatL', { T: 'cmm_clientes', C: 'Nombre', I: 'ID'}, function(resCat) {
                    remoteFormDialog(val[2], function (html_f) {
                        commandRequest('query', {table: val[3], id: caller.closest('form').find('input[name=ID]').val()}, function(result) {
                            var fCon = createForm(html_f, resCat.result[result.res.Cliente] + ' (Venta)');
                            var table = tableHtmlize(secureParse(result.res.Productos));
                            $(table).find('tr').each(function() {
                                var toadd = $(this);
                                toadd.addClass('item result productItem');
                                $(toadd.find('td')[4]).addClass('price');
                                $(toadd.find('td')[5]).addClass('iva');
                                $(toadd.find('td')[6]).addClass('qnt');
                                var itm = fCon.find('.items').find('.tblItems').append(toadd);
                            });
                            fCon.find('.options').find('[name=client]').val(result.res.Cliente);
                            fCon.find('.options').find('[name=sdate]').val(dateSQL(new Date(result.res.Fecha)));
                            fCon.find('.options').find('[name=notes]').text(result.res.Notas);
                            fCon.find('.options').find('[name=arr]').val(result.res.Arrendadora);
                            bindForm();
                        });
                    }, false);
                })
            break;
            case 'post':
                if (!fIsValid($(this).closest('form'))) {
                    createDialog('<p>Hay datos requeridos aún no llenados. Verifica tu formulario antes de enviarlo.</p>');
                    break;
                }
                var res = sendData('postSatGen', new FormData($(this).closest('form')[0]));
                if (res) {
                    doResponse(res);
                }
            break;
            case 'document':
                commandRequest('document', {table: val[1], id: val[2]}, function(resZ) {
                    if (resZ.file == null) {
                        createDialog('<p>Documento no encontrado.</p>');
                        return;
                    }
                    download(resZ.file);
                });
            break;
            case 'chat':
                commandRequest('chat', {id: val[1]}, function(resZ) {

                    if (chats == null) {
                        chats = {
                            "0": null
                        };

                            createDialog(resZ.html, 'Chat', 550, 'auto', false, function(frm) {
                                chats[val[1]] = frm;
                                //frm.find('[name=with]').val(data.from);

                                getChatWith(val[1], frm.find('.messageLog'));
                            });

                    } else {
                        if (chats[val[1]]) {
                            if (!chats[val[1]].is(':visible')) {

                                    createDialog(resZ.html, 'Chat', 550, 'auto', false, function(frm) {
                                        chats[val[1]] = frm;
                                        //frm.find('[name=with]').val(data.from);

                                        getChatWith(val[1], frm.find('.messageLog'));
                                    });

                            } else {
                                getChatWith(val[1], chats[val[1]].find('.messageLog'));
                            }
                        } else {

                                createDialog(resZ.html, 'Chat', 550, 'auto', false, function(frm) {
                                    chats[val[1]] = frm;
                                    //frm.find('[name=with]').val(data.from);

                                    getChatWith(val[1], frm.find('.messageLog'));
                                });
                        }
                    }
                });
            break;
            case 'nprocess':
                switch (val[1]) {
                    case 'cmm_cotizaciones':
                        askFromQuery(val[2], isAdmon());
                    break;
                    case 'cmm_ventas':
                        saleFromQuery(val[2], isAdmon());
                    break;
                }
            break;
            case 'edition':
                remoteEditForm(val[1], {table: val[2], id: $(this).closest('form').find('#' + val[3]).val()});
            break;
            case 'setNotif':
                var btn = $(this);
                createAskingDialog('<p>¿Está seguro de marcar la notificación como revisada? Esta acción es irreversible.', function(ans) {
                    if (ans) {
                        commandRequest('setNotif', {id: val[1]}, function(resZ) {
                            createDialog(resZ.html);
                            if (resZ.success) btn.closest('td').closest('tr').remove();
                        });
                    }
                });
            break;
            case 'iQuery':
                commandRequest(val[1], {}, function(qres) {
                    var ks = Object.keys(qres);
                    if (ks.length == 1) {
                        if (qres[ks[0]].constructor === String) {
                            createDialog('<pre>' + qres[ks[0]].replace(/\\n/g, '\n') + '</pre>');
                            return;
                        }
                    }

                    createDialog('<pre>' + JSON.stringify(qres, null, 3) + '</pre>');
                })
            break;
            case 'iQueryA':
                createFormDialog('<input type="text" name="b" placeholder="Búsqueda..." />', function(res_iQa) {
                    commandRequest(val[1], {filter: res_iQa.get('b')}, function(qres) {
                        createDialog('<pre>' + qres.stdout.replace(/\\n/g, '\n') + '</pre>');
                        //createDialog('<pre>' + JSON.stringify(qres, null, 3) + '</pre>');
                    });
                });
            break;
            case 'pmtest':
                createFormDialog(`<input type="text" name="to" placeholder="ID de usuario a..." />
                <input type="text" name="msg" placeholder="Mensaje" />`, function(resPM) {
                    var to = resPM.get('to');
                    var msg = resPM.get('msg');

                    commandRequest('sendPM', {
                        with: to,
                        msg: msg
                    }, function (resP) {
                        if (resP) {
                            if (resP.success) {
                                createDialog('Correcto.');
                            } else {
                                createDialog('Error.');
                            }
                        }
                    })
                }, 'Prueba de mensaje');
            break;
            case 'docExport':
                createFormDialog('<input type="text" name="dname" placeholder="Nombre del documento" />', function(resDoc) {
                    var nam = resDoc.get('dname');
                    if (val[1] == 'pdf') {
                        var con = getBodyContent();
                        if (con) {
                            askForDocument(con.find('.overcon').find('table')[0].outerHTML, nam, val[1]);
                        }
                    } else if (val[1] == 'csv') {
                        var con = getBodyContent();
                        if (con) {
                            var csv = $(getBodyContent().find('.overcon').find('table:not(:hidden)')[0]).table2CSV({delivery: 'value'});

                            download(csv, nam + '.csv');
                        }
                    }
                }, 'Exportar a documento');
            break;
        }
    });

    $('.treeView').jstree();
    $('.treeView').unbind('changed.jstree');
    $('.treeView').on('changed.jstree', function (event, data) {
        var selected = data.selected;
        var i, j, r = [];
        for(i = 0, j = selected.length; i < j; i++) {
          r.push($(this).jstree(true).get_node(selected[i]));
        }
        var cont = $(this).closest('.row').find('#con' + $(this).attr('id'));
        var pr_class = $(this).attr('data-prclass');

        var prs = [];
        for (let rx = 0; rx < selected.length; rx++) {
            var element = r[rx];
            var pr = secureParse(element.li_attr['data-pr']);
            if (pr) {
                prs.push(pr);
            } else {
                for (let c = 0; c < element.children_d.length; c++) {
                    const child = $(this).jstree(true).get_node(element.children_d[c]);
                    if (child.li_attr['data-pr']) {
                        var pr = secureParse(child.li_attr['data-pr']);
                        if (pr) {
                            prs.push(pr);
                        }
                    }
                }
            }
        }
        if (prs.length < 1) return;
        var table = tableHtmlize(prs, '', pr_class, /*!pr_class.includes('norecursive')*/);
        cont.html(table);
        processInputs();
        //bindSeekers();
        bindOnDialog();
        $("html, body").animate({ scrollTop: $('.overcon').offset().top - $('.menu').height() - 20 }, "slow");
      });
      $('#btn-filtered').unbind('click');
      $('#btn-filtered').on('click', function() {
        $('.treeView').jstree("deselect_all");
        var node = $('.treeView').jstree(true).get_node('#');
        for (var c = 0; c < node.children_d.length; c++) {
            var child = $('.treeView').jstree(true).get_node(node.children_d[c]);
            if (child.li_attr['data-pr'] != undefined) {
                var obj = secureParse(child.li_attr['data-pr']);
                if (obj) {
                    if (String(obj.ID) == String($('#filtered').val())) {
                        $('.treeView').jstree(true).select_node(node.children_d[c]);
                    }
                }
            }
        }
      });
    $('.zip').blur(function() {
        var zip = $(this).val();
        var city = '';
        var state = '';
        var element = $(this);

        $.getJSON('https://maps.googleapis.com/maps/api/geocode/json?components=country:MX|postal_code:'+zip+'&key=AIzaSyBz9W_6hIm3y9dj7YwPK_PwQKSTlGLKH-g', function(response){
            var address_components = response.results[0].address_components;
            var cities = response.results[0].postcode_localities;

            $.each(address_components, function(index, component){
                var types = component.types;
                $.each(types, function(index, type){
                    if(type == 'locality') {
                        city = component.long_name;
                    }
                    if(type == 'administrative_area_level_1') {
                        state = component.long_name;
                    }
                });
            });

            element.closest('form').find('input[name=' + element.attr('data-zipstate') + ']').val(state);
            element.closest('form').find('input[name=' + element.attr('data-zipcity') + ']').val(city);

            /*if (cities) {
                //turn city into a dropdown if necessary
                var $select = $(document.createElement('select'));
                $.each(cities, function(index, locality) {
                    var $option = $(document.createElement('option'));
                    $option.html(locality);
                    $option.attr('value',locality);
                    if(city == locality) {
                        $option.attr('selected','selected');
                    }
                    $select.append($option);
                });
                $select.attr('name', element.attr('data-zipcity'));
                var inp = element.closest('form').find('input[name=' + element.attr('data-zipcity') + ']')
                var sel = element.closest('form').find('select[name=' + element.attr('data-zipcity') + ']')
                if (inp.length > 0) {
                    inp[0].outerHTML = $select[0].outerHTML;
                } else if (sel.length > 0) {
                    sel[0].outerHTML = $select[0].outerHTML;
                }
            } else {
                var inp = element.closest('form').find('input[name=' + element.attr('data-zipcity') + ']')
                var sel = element.closest('form').find('select[name=' + element.attr('data-zipcity') + ']')
                if (inp.length > 0) {
                    inp[0].outerHTML = `<input type="text" name="${element.attr('data-zipcity')}" value="${city}" />`;
                } else if (sel.length > 0) {
                    sel[0].outerHTML = `<input type="text" name="${element.attr('data-zipcity')}" value="${city}" />`;
                }
            }*/
        });
    });
    $('.qnt').each(function() {
        if ($(this).attr('title', 'Doble click para cambiar valores')) {
            $(this).tooltip();
        }
    })
    $('.qnt').unbind('dblclick');
    $('.qnt').dblclick(function() {
        var item = $(this).closest('tr');
       productProperties(item, item.hasClass('admon'));
    });
    $('.price').unbind('click');
    $('.price').click(function() {
        var qnts = $(this).closest('tr').closest('tbody').find('.price');

        if (qnts.length > 0) {
            var total = 0;
            for (let q = 0; q < qnts.length; q++) {
                if (isNaN(qnts[q].innerText)) continue;
                if (!$(this).is(':visible')) continue;
                if (!qnts[q]) continue;
                if (!qnts[q].nextSibling) continue;
                if (!qnts[q].nextSibling.nextSibling) continue;
                var ttotal = (Number(qnts[q].innerText) * Number(qnts[q].nextSibling.nextSibling.innerText));
                var iva = ttotal * 0.16;
                if (qnts[q].nextSibling.innerText == 'on' || qnts[q].nextSibling.innerText == '1') {
                    total += ttotal + iva;
                } else {
                    total += ttotal;
                }
            }
            if (total > 0) createDialog(`<p>Total de venta: ${total}</p>`);
        }
    });
}

// Content Functions

/**
 * Returns the default 'content' container of the document.
 */
function getBodyContent() {
    if ($('body').find(".content").length > 0) {
        return $('body').find(".content");
    } else {
        if ($('body').find("#content").length > 0) {
            return $('body').find("#content");
        } else {
            return false;
        }
    }
}
/**
 * Appends a '<option value="${a}">${b}</option>' to the desired (i) item.
 *
 * @param {jquery} i'<select >' element to append the option item.
 * @param {String} a Value of the option.
 * @param {String} b Option caption.
 */
function appendToSelect(i, a, b) {
    if (i.find(`option[value="${a}"]`).length < 1) i.append(`<option value='${a}'>${b}</option>`);
}
/**
 * Checks if all the 'required' class items in the specified form are filled.
 *
 * @param {jquery} form JQuery form object to perform the validation.
 */
function fIsValid(form) {
    var valid = true;
    var req = form.find('.required');
    if (req.length > 0) {
        for (let r = 0; r < req.length; r++) {
            if ($(req[r]).val() == '' || $(req[r]).val() == undefined) {
                valid = false;
            }
        }
    }
    if (!valid) {
        return false;
    }
    return true;
}
/**
 * Analizes and process the desired form input fields and returns a FormData object with the result.
 *
 * @param {HTMLFormObject} form Desired form to perform the data processing.
 */
function processFormData(form) {
    var dat = new FormData(form[0]);
    var it = form.closest('.row');
    var et = form.find('.editable');
    var nm = form.find('.numeric');
    var st = form.find('.sendThis');
    console.log(it);
    console.log(et);
    if (it.length > 0) {
        var j = [];
        var t = it.find('.tblItems')[0];
        var x = 0; var y = 0;
        for (let row of t.rows) {
            if (y == 0) { y++; continue; }
            if (row.getAttribute('title')) {
                j[y - 1] = [];
                j[y - 1][x] = 'status:' + row.getAttribute('title');
                x++;
            } else {
                j[y - 1] = [];
            }
            for(let cell of row.cells) {
                let value = cell.innerText;
                j[y - 1][x] = value.replace('"', '\\"').replace('\t', '');
                x++;
            }
            x = 0;
            y++;
        }

        var str=JSON.stringify(j).replace('\t', '');
        dat.append('items', str.replace('\t', ''));
        console.log(j);
    }
    if (et.length > 0) {
        for (let te = 0; te < et.length; te++) {
            var j = [];
            var t = et[te];
            var x = 0; var y = 0;
            for (let row of t.rows) {
                if (y == 0) { y++; continue; }
                if (row.innerHTML == "") { continue; }
                j[y - 1] = [];
                for(let cell of row.cells) {
                    let inputs = cell.querySelectorAll('INPUT,SELECT,TEXTAREA');
                    if (inputs.length > 0) {
                        let input = inputs[0];
                        if (input.getAttribute('type') != 'button') {
                            let value = String(input.value).replace('\n', '\\n');
                            j[y - 1][x] = value.replace('"', '\\"');
                            x++;
                        }
                    }
                }
                x = 0;
                y++;
            }
            console.log(t.getAttribute('name'));
            dat.append(t.getAttribute('name'), JSON.stringify(j));
            console.log(j);
        }
    }
    if (nm.length > 0) {
        for(let n = 0; n < nm.length; n++) {
            var v = String(nm[n].value);
            dat.set(nm[n].getAttribute('name'), Number(v.replace(',', '').trim()));
        }
    }

    if (st.length > 0) {
        for(let os = 0; os < st.length; os++) {
            var st_v = st[os];
            var st_name = st[os].getAttribute('name');

            var img = st_v.toDataURL();
            var file = null;

            var byteString;
            if (img.split(',')[0].indexOf('base64') >= 0) {
                byteString = atob(img.split(',')[1]);
            } else {
                byteString = unescape(img.split(',')[1]);
            }
            // separate out the mime component
            var mimeString = img.split(',')[0].split(':')[1].split(';')[0];
            // write the bytes of the string to a typed array
            var ia = new Uint8Array(byteString.length);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            var blob = new Blob([ia], {type:mimeString});
            file = new File([blob], 'blobIMG.png');

            download(file, 'img-' + st_name + '.png');
            console.log(file);

            dat.append(st_name, file)
        }
    }

    dat.append('session', session.id);

    if (!fIsValid(form)) {
        createDialog('<p>Hay datos requeridos aún no llenados. Verifica tu formulario antes de enviarlo.</p>');
        return false;
    }

    return dat;
}
/**
 * Sends the specified form to the server.
 *
 * @param {jquery} form JQuery object of the desired form to send.
 * @param {Boolean} resetf Wether to reset the form when is sent or not.
 */
function sendForm(form, resetf = false) {
    var ret;
    var dat = processFormData(form);
    if (!dat) return;

    $.ajax({
        url: form.attr("action"),
        type: "POST",
        dataType: "html",
        data: dat,
        cache: false,
        contentType: false,
        async: false,
        processData: false
        })
        .done(function(rdata){
            if (resetf) form[0].reset();
            ret = rdata;
        });
    return ret;
}
/**
 * Sends raw data to the server as an instruction or 'form action' mode.
 *
 * @param {String} action Server instruction.
 * @param {*} dta Data to be sent; FormData type object desirable.
 */
function sendData(action, dta) {
    var ret;
    var tdta;
    if (dta.constructor === FormData) {
        if (!dta.get('session')) dta.append('session', session.id);
    }
    $.ajax({
        url: action,
        type: "POST",
        dataType: "html",
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
function putOnContent(html, title = 'Resultados') {
    var content = getBodyContent();
    var results = content.find('#results').find('.container');
    var lTitle = content.find('.ui-tabs-anchor').filter('[href="#results"]');
    if (!content) return false;
    if (results.length > 0) {
        results.html(html);
        results.find('#accordion').accordion({
            collapsible: true
        });
        $('body').find(".tabs").tabs().addClass( "ui-tabs-vertical ui-helper-clearfix" );
        $('body').find(".tabs li").removeClass( "ui-corner-top" ).addClass( "ui-corner-left" );

        lTitle.text(title);
    } else {
        content.html(html);

        lTitle.text(title);
    }
    bindForm();
    return true;
}
function loadOnContent(url, data) {
    var content = getBodyContent();
    var ret = null;
    if (!content) return false;
    content.find('#results').find('.container').load(url, data, function (responseTxt, statusTxt, xhr) {
        if (statusTxt == "error") {
            alert("Error: " + xhr.status + ": " + xhr.statusText);
            ret = false;
        }
        $('input,textarea,select,checkbox,radio,button').addClass('form-control');
        ret = true;
    });
    content.find('#results').find('.container').find('#accordion').accordion({
        collapsible: true
    });
    $('body').find(".tabs").tabs().addClass( "ui-tabs-vertical ui-helper-clearfix" );
    $('body').find(".tabs li").removeClass( "ui-corner-top" ).addClass( "ui-corner-left" );
    bindForm();
    return ret;
}

function createForm(html, title) {
    var id = 0;
    var content = getBodyContent();
    if (!content) return false;
    while(true) {
        if (content.find('#form' + id).length > 0) {
            id++;
        } else {
            var tabTemplate = "<li><a href='#{href}' class='aFormTitle'>#{label}</a></li>"
            var label = title || "form " + id,
                id = "form" + id,
                li = $( tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) ),
                tabContentHtml = html || "Form " + id + " content.";

            $(content.find( "ul" )[0]).append( li );
            var ret = content.append( "<div id='" + id + "' class='aForm'>" + tabContentHtml + "</div>" ).find("#" + id);
            content.tabs( "refresh" );
            $("html, body").animate({ scrollTop: $("#" + id).offset().top }, "slow");
            //bindForm();
            return ret;
        }
    }
}

// User Interface Functions
function loadOnDialog(url, title = 'Artemisa', w = 550, h = 'auto', f = false) {
    $( function() {
        $( "<div class='dialogDiv' title='" + title + "'>" + sendData(url, null) + "</div>" ).dialog( {
            position: { my: "center", at: "center", of: window },

            modal: true,
            width: w,
            height: h,
            resizable: !f,
            close: function () {
                $("body").find(".menu").show();
            },
            open: function() {
                $("html, body").animate({ scrollTop: $(this).offset().top - (window.innerHeight / 4) }, "slow");
                $("body").find(".menu").hide();
                $(this).find('input,textarea,select,checkbox,radio,button').addClass('form-control');
                bindForm();
            },
            buttons: {
                Cerrar: function() {
                    $( this ).dialog( "close" );
                }
            }
        });
    } );
}
function createDialog(divHTML, title = 'Artemisa', w = 550, h = 'auto', f = false, processing = function() {}) {
    var d = $( "<div class='dialogDiv' title='" + title + "'>" + divHTML + "</div>" );
    d.dialog( {
        position: { my: "center", at: "center", of: window },

        modal: true,
        width: w,
        height: h,
        resizable: !f,
        close: function () {
            $("body").find(".menu").show();
        },
        open: function() {
            $("html, body").animate({ scrollTop: $(this).offset().top - (window.innerHeight / 4) }, "slow");
            $("body").find(".menu").hide();
            $(this).find('input,textarea,select,checkbox,radio,button').addClass('form-control');
            bindForm();
            processing(d);
            if (d.find('.postProcess').length > 0) {
                var postProcessF = new Function(d.find('.postProcess')[0].innerHTML);
                postProcessF.call(d);
            }
        },
        buttons: {
            Cerrar: function() {
                $( this ).dialog( "close" );
            }
        }
    });
}
/**
 * Creates a dialog with two buttons and the specified HTML content for asking questions to the user.
 *
 * @param {String} divHTML Content of the dialog box, HTML enabled.
 * @param {Function} callBack Function, taking one argument, called when the user presses a button; parameter is true if user presses 'ok';
 * @param {String} title Dialog title; default: 'Artemisa'.
 * @param {Number} w Dialog width.
 * @param {String} h Dialog height.
 * @param {Boolean} f Wether the dialog is fixed or not.
 */
function createAskingDialog(divHTML, callBack = function(answer = false) {}, title= 'Artemisa', w = 550, h = 'auto', f = false) {
    $( function() {
        $( "<div class='dialogAskDiv' title='" + title + "'>" + divHTML + "</div>" ).dialog( {
            position: { my: "center", at: "center", of: window },

            modal: true,
            width: w,
            height: h,
            resizable: !f,
            close: function () {
                $("body").find(".menu").show();
            },
            open: function() {
                $("html, body").animate({ scrollTop: $(this).offset().top - (window.innerHeight / 4) }, "slow");
                $("body").find(".menu").hide();
                $(this).find('input,textarea,select,checkbox,radio,button').addClass('form-control');
            },
            buttons: {
                Aceptar: function() {
                    callBack(true);
                    $( this ).dialog( "close" );
                },
                Cancelar: function() {
                    callBack(false);
                    $( this ).dialog( "close" );
                }
            }
        });
    } );
}
/**
 *
 * @param {String} frm Form name from the server.
 * @param {Object} queryObject Database query object
 * @param {*} tr
 * @param {*} keys
 */
function remoteEditForm(frm, queryObject = {table: '', id: ''}, tr = null, keys = []) {
    remoteFormDialog(frm, function (answer) {
        var retE = sendData(frm, answer);
        doResponse(retE);
        if (tr == null) return;
        commandRequest('query', queryObject, function(itds) {
            var tds = tr.find('td');
            for (let t = 0; t < tds.length; t++) {
                tds[t].innerText = itds.res[keys[t]];
            }
        });
    }, true, function(formO) {
        commandRequest('query', queryObject, function(itds) {
            var ele = formO.find('form').find('[data-from]');
            for (let i = 0; i < ele.length; i++) {
                var el = $(ele[i]);
                console.log(el[0].tagName);
                var valA = el.attr('data-from');
                console.log(valA);
                if (itds.res[valA] != undefined) {
                    switch (el[0].tagName) {
                        case 'TEXTAREA':
                            el.text(itds.res[valA]);
                        break;
                        case 'TABLE':
                            var sp = secureParse(itds.res[valA]);
                            if (sp) {
                                el.append($(tableHtmlize(sp)).find('tr'));
                            } else {
                                el[0].outerHTML = '<label>Vacío</label>';
                            }
                        break;
                        case 'SELECT':
                            el.val(itds.res[valA]);
                        break;
                        case 'INPUT':
                            switch (el.attr('type')) {
                                case 'checkbox':
                                    //formO.find('[name="iva"]').prop('checked', (itds.res[valA] == 0 ? false : true));
                                    el.prop('checked', (itds.res[valA] == 0 ? false : true));
                                break;
                                case 'date':
                                    el.val(dateSQL(new Date(itds.res[valA])));
                                break;
                                default:
                                    el.val(itds.res[valA]);
                                break;
                            }
                        break;
                    }
                }
            }
            bindForm();
            if (!session.info.Acceso.includes(':rw') && !session.info.Acceso.includes('total')) {
                formO.find('input, textarea, select').each(function() {
                    var eVal = ($(this).text() != '' ? $(this).text() : $(this).val());
                    if ($(this).attr('type') != 'hidden') {
                        $(this)[0].outerHTML = `<label>${eVal}</label>`;
                    }
                });
            }
            var id = formO.find('form').append(`<input type="hidden" name="ID" value="${itds.res.ID}" />`);
        });
    });
}

function remoteFormDialog(frm, callBack = function(answer = new FormData()) {}, createDialog = true, processing = function(formObject) {}, tblItems = null, sendForm = true) {
    commandRequest('form', { form: frm }, function(answer) {
        var html = String(answer.html).replace(/{namegen}/g, nameGen());
        var tables = [];
        var inner = [];
        var p = 0;
        var toQuery = function (ite, finish) {
            if (tables[p] == undefined) {
                finish();
                return;
            }
            if (tables[p].TCI != undefined) {
                commandRequest('getCat', { T: tables[p].TCI[0], C: tables[p].TCI[1], I: tables[p].TCI[2] }, function (ans) {
                    tables[p].result = ans.result;
                    p++;
                    ite (ite, finish);
                });
            } else if (tables[p].TCIw != undefined) {
                commandRequest('getCatR', { T: tables[p].TCIw[0], C: tables[p].TCIw[1], I: tables[p].TCIw[2], W: tables[p].TCIw[3] }, function (ans) {
                    tables[p].result = ans.result;
                    p++;
                    ite (ite, finish);
                });
            }
        };

        var t_html = html.split('\n');
        for (let i = 0; i < t_html.length; i++) {
            var line = t_html[i];
            if (line.includes('{')) {
                var st = line.indexOf('{') + 1;
                var l_str = line.substring( st, line.indexOf( '}', st ) );
                var l_spl = l_str.split(':');
                if (l_spl.length == 3) {
                    tables.push( {
                        TCI: l_spl,
                        result: null,
                        str: l_str
                    } );
                } else if (l_spl.length == 2) {
                    if (l_spl[0] == 'tbl' || l_spl[0] == 'col' || l_spl[0] == 'subTbl') {
                        inner.push( {
                            type: l_spl[0],
                            value: l_spl[1]
                        } );
                    }
                } else if (l_spl.length == 4) {
                    tables.push( {
                        TCIw: l_spl,
                        result: null,
                        str: l_str
                    } );
                }
            }
        }
        toQuery(toQuery, function() {
            for (let x = 0; x < tables.length; x++) {
                var h_t = '';
                for (let z = 0; z < tables[x].result.length; z++) {
                    const tres = tables[x].result[z];
                    if (!tres) { continue; }
                    if (tables[x].TCI != undefined) {
                        h_t += (`<option value='${tres[tables[x].TCI[2]]}'>${tres[tables[x].TCI[1]]}</option>`);
                    } else {
                        h_t += (`<option value='${tres[tables[x].TCIw[2]]}'>${tres[tables[x].TCIw[1]]}</option>`);
                    }
                }
                html = html.replace(tables[x].str, h_t);
            }
            if (tblItems != null && $(html).find('.tblItems').length > 0) {
                html = html.replace($(html).find('.tblItems')[0].outerHTML, $(html).find('.tblItems').append(tblItems)[0].outerHTML);
                for (let y = 0; y < inner.length; y++) {
                    const innTbl = inner[y];
                    var tbl = $(html).find('.tblItems')[0];
                    switch (innTbl.type) {
                        case 'col':
                            var html_t = '';
                            for (let z = 0; z < tbl.rows.length; z++) {
                                const row = tbl.rows[z];
                                html_t += `<option value='${row.cells[0].innerHTML}'>${row.cells[innTbl.value].innerHTML}</option>`;
                            }
                            html = html.replace(`{col:${innTbl.value}}`, html_t);
                            break;
                        case 'tbl':
                            html = html.replace(`{tbl:${innTbl.value}}`, tbl.rows[0].cells[innTbl.value].innerHTML);
                            break;
                        case 'subTbl':
                            var subTbl = $(tbl.rows[0].cells[innTbl.value].innerHTML).find('table')[0];
                            var html_t = '';
                            for (let z = 0; z < subTbl.rows.length; z++) {
                                const row = subTbl.rows[z];
                                html_t += `<option value='${row.cells[0].innerHTML}'>${row.cells[1].innerHTML}</option>`;
                            }
                            html = html.replace(`{subTbl:${innTbl.value}}`, html_t);
                            break;
                    }
                }
            }
            if (createDialog) {
                var d = createFormDialog(html, callBack);
                processing(d);
            } else {
                callBack(html);
            }
        })
    });
}
function dCat(d, finished = function() {}) {
    d.find('select.dcat').each(function() {
        var t = $(this);
        var inner = String(t.html());
        console.log(t.val());
        console.log(inner);
        if (inner.includes('{')) {
            var i_spl = inner.replace('{', '').replace('}', '').split(':');
            commandRequest('getCat', {
                T: i_spl[0],
                C: i_spl[1],
                I: i_spl[2]
            }, function(answer){
                var hTemp = '';
                for (var i in answer.result) {
                    if (t.val() == answer.result[i][i_spl[2]]) {
                        hTemp += (`<option value='${answer.result[i][i_spl[2]]}' selected>${answer.result[i][i_spl[1]]}</option>`);
                    } else {
                        hTemp += (`<option value='${answer.result[i][i_spl[2]]}'>${answer.result[i][i_spl[1]]}</option>`);
                    }
                }
                t.html(hTemp);
                finished();
            });
        }
    });
}
function createFormDialog(divHTML, callBack = function(result = new FormData()) {}, title= 'Artemisa', process = function(dialog) {}, w = 550, h = 'auto', f = false) {
    var d = $( "<div class='dialogFrmDiv' title='" + title + "'><form class='createForm' enctype='multipart/form-data'>" + divHTML + "</form></div>" );
    var bindThis = function() {
        d.find('.createForm').unbind('submit');
        d.find('.createForm').submit(function(event) {
            event.preventDefault();
            event.stopImmediatePropagation();

            var form = d.find('.createForm');
            if (!fIsValid(form)) {
                createDialog('<p>Hay datos requeridos aún no llenados. Verifica tu formulario antes de enviarlo.</p>');
                return;
            }
            var fdata = processFormData(form);
            callBack(fdata);
            d.dialog( "close" );
        });
    };

    d.dialog( {
        position: { my: "center", at: "center", of: window },

        modal: true,
        width: w,
        height: h,
        resizable: !f,
        close: function () {
            $("body").find(".menu").show();
        },
        open: function() {
            $("html, body").animate({ scrollTop: $(this).offset().top - (window.innerHeight / 4) }, "slow");
            $("body").find(".menu").hide();
            d.find('input,textarea,select,checkbox,radio,button').addClass('form-control');
            bindForm();
            bindThis();
            process(d);
            if (d.find('.postProcess').length > 0) {
                var postProcessF = new Function(d.find('.postProcess')[0].innerHTML);
                postProcessF.call(d);
            }
        },
        buttons: {
            Aceptar: function() {
                if (!fIsValid(d.find('.createForm'))) {
                    createDialog('<p>Hay datos requeridos aún no llenados. Verifica tu formulario antes de enviarlo.</p>');
                    return;
                }
                var fdata = processFormData(d.find('.createForm'));
                callBack(fdata);
                $( this ).dialog( "close" );
            },
            Cancelar: function() {
                $( this ).dialog( "close" );
            }
        }
    });

    console.log(d);
    return d;
}
function permissionDialog(callBack = function(response) {}) {
    var ret = false;
    var d = $( "<div class='dialogFrmDiv' title='Permiso de Gerencia'><form class='createForm' enctype='multipart/form-data'><input type='text' name='user' placeholder='Nombre de usuario' /><input type='password' name='pass' placeholder='Contraseña' /></form></div>" );
    var bindThis = function() {
        d.find('.createForm').unbind('submit');
        d.find('.createForm').submit(function(event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            var form = d.find('.createForm');
            if (!fIsValid(form)) {
                createDialog('<p>Hay datos requeridos aún no llenados. Verifica tu formulario antes de enviarlo.</p>');
                return;
            }
            commandRequest('askperm', {user: form.find('input[name=user]').val(), pass: form.find('input[name=pass]').val()}, function(response) {
                if (response.success) {
                    ret = true;
                    d.dialog( "close" );
                } else {
                    createDialog('<p>' + response.message + '</p>');
                }
            })
        });
    };

    d.dialog( {
        position: { my: "center", at: "center", of: window },

        modal: true,
        width: 550,
        height: 'auto',
        resizable: false,
        close: function () {
            $("body").find(".menu").show();
            callBack(ret);
        },
        open: function() {
            $("html, body").animate({ scrollTop: $(this).offset().top - (window.innerHeight / 4) }, "slow");
            $("body").find(".menu").hide();
            d.find('input,textarea,select,checkbox,radio,button').addClass('form-control');
            bindForm();
            bindThis();
            if (d.find('.postProcess').length > 0) {
                var postProcessF = new Function(d.find('.postProcess')[0].innerHTML);
                postProcessF.call(d);
            }
        },
        buttons: {
            Aceptar: function() {
                if (!fIsValid(d.find('.createForm'))) {
                    createDialog('<p>Hay datos requeridos aún no llenados. Verifica tu formulario antes de enviarlo.</p>');
                    return;
                }
                var form = d.find('.createForm');
                commandRequest('askperm', {user: form.find('input[name=user]').val(), pass: form.find('input[name=pass]').val()}, function(response) {
                    if (response.success) {
                        ret = true;
                        d.dialog( "close" );
                    } else {
                        createDialog('<p>' + response.message + '</p>');
                    }
                })
            },
            Cancelar: function() {
                ret = false;
                $( this ).dialog( "close" );
            }
        }
    });

    console.log(d);
    return d;
}
function loading(callBack = function() {}) {
    console.log("loading...");
    $("body").find('.keepw').remove();
    $("body").find(".menu").hide();
    $('span').hide();
    $('table').hide();
    $('.box').hide();
    $("body").find(".loading").show( "fold", 1000, function() {
        callBack();
    });
}
function loaded() {
    console.log("loaded.");
    $("body").find(".loading").hide();
    $("body").find(".menu").show();
    $('.box').show('fold', 1000, function() {
        $('span').fadeIn(800);
    });

    $('span').hide();
    $('table').hide().show('fold', 500);
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


function collapsibleContent(HTML) {
    var tid = nameGen();
    var html = HTML;
    try {
        html = HTML.replace('undefinedundefined', '');
    } catch (error) {

    }

    return `<button id="btn${tid}" onclick="$('.div${tid}').toggle(1000);">Ver Datos</button><div class="div${tid}" style="display: none;">${html}</div>`;
}
function dateSQL(date) {
    var ret = (String(date.getFullYear()) + '-' + String(("0" + String(date.getMonth() + 1)).slice(-2)) + '-' + String(("0" + String(date.getDate())).slice(-2)));
    if (ret.toLowerCase().includes('nan')) ret = NaN;
    return ret;
}
function datetimeSQL(date) {
    var ret = (String(date.getFullYear()) + '-' + String(("0" + String(date.getMonth() + 1)).slice(-2)) + '-' + String(("0" + String(date.getDate())).slice(-2)) + ' ' + String(("0" + String(date.getHours())).slice(-2)) + ':' + String(("0" + String(date.getMinutes())).slice(-2)) + ':' + String(("0" + String(date.getSeconds())).slice(-2)));
    if (ret.toLowerCase().includes('nan')) ret = NaN;
    return ret;
}

function askForDocument(html, title, type = 'csv') {
    loading(function() {
        var cobj = {
            dtype: type,
            dobj: {
                title: title,
                content: html
            }
        };
        commandRequest('docuGen', cobj, function(answer) {
            doResponse(answer);
            loaded();
        });
    });
}

function tableCSV(element) {
    var ret = String();
    var tr = element.find('tr');

    for (let y = 0; y < tr.length; y++) {
        var td = tr[y].querySelectorAll('td');
        for (let x = 0; x < td.length; x++) {
            var tv = td.innerText.replace(/["]/g, "“").replace(/&nbsp;/g,' ').replace(/\n/g, ' ');
            ret += tv + ',';
        }
        ret = ret.slice(0, ret.length - 2) + '\n';
    }

    return ret;
}

// Table to CSV ---> https://github.com/rubo77/table2CSV
jQuery.fn.table2CSV = function(options) {
    var options = jQuery.extend({
        separator: ',',
        header: [],
        headerSelector: 'th',
        columnSelector: 'td',
        delivery: 'popup', // popup, value, download
        // filename: 'powered_by_sinri.csv', // filename to download
        transform_gt_lt: true // make &gt; and &lt; to > and <
    },
    options);

    var csvData = [];
    var headerArr = [];
    var el = this;

    //header
    var numCols = options.header.length;
    var tmpRow = []; // construct header avalible array

    if (numCols > 0) {
        for (var i = 0; i < numCols; i++) {
            tmpRow[tmpRow.length] = formatData(options.header[i]);
        }
    } else {
        if ($(el).find('thead').length > 0) {
            $(el).children('thead').children('tr').children(options.headerSelector).each(function() {                
                if ($(this).css('display') != 'none') {
                    tmpRow[tmpRow.length] = formatData($(this).text());
                }
            });
        } else {
            $(el).children(options.headerSelector).each(function() {
                if ($(this).css('display') != 'none') {
                    tmpRow[tmpRow.length] = formatData($(this).text());
                }
            });
        }
    }

    row2CSV(tmpRow);

    // actual data
    if ($(el).find('tbody').length > 0) {
        $(el).children('tbody').children('tr').each(function() {
            var tmpRow = [];
            $(this).children(options.columnSelector).each(function() {
                var tTr = $(this).find('tr');
                if (tTr.length > 0) {
                    console.log(tTr);
                    var tmpTxt = '';
                    for (let y = 0; y < tTr.length; y++) {
                        var tTd = tTr[y].querySelectorAll('td');
                        if (tTd.length > 0) {
                            for (let x = 0; x < tTd.length; x++) {
                                tmpTxt += (x < tTd.length - 1 ? tTd[x].innerText + ', ' : tTd[x].innerText)
                            }
                        }
                    }
                    tmpRow[tmpRow.length] = formatData(tmpTxt);
                } else {
                    tmpRow[tmpRow.length] = formatData($(this).text());
                }
            });
            row2CSV(tmpRow);
        });
    } else {
        $(el).children('tr').each(function() {
            var tmpRow = [];
            $(this).children(options.columnSelector).each(function() {
                var tTr = $(this).find('tr');
                if (tTr.length > 0) {
                    console.log(tTr);
                    var tmpTxt = '';
                    for (let y = 0; y < tTr.length; y++) {
                        var tTd = tTr[y].querySelectorAll('td');
                        if (tTd.length > 0) {
                            for (let x = 0; x < tTd.length; x++) {
                                tmpTxt += (x < tTd.length - 1 ? tTd[x].innerText + ', ' : tTd[x].innerText);
                            }
                        }
                    }
                    tmpRow[tmpRow.length] = formatData(tmpTxt);
                } else {
                    tmpRow[tmpRow.length] = formatData($(this).text());
                }
            });
            row2CSV(tmpRow);
        });
    }
    if (options.delivery == 'popup') {
        var mydata = csvData.join('\n');
        if(options.transform_gt_lt){
            mydata=sinri_recover_gt_and_lt(mydata);
        }
        return popup(mydata);
    }
    else if(options.delivery == 'download') {
        var mydata = csvData.join('\n');
        if(options.transform_gt_lt){
            mydata=sinri_recover_gt_and_lt(mydata);
        }
        var url='data:text/csv;charset=utf8,' + encodeURIComponent(mydata);
        window.open(url);
        return true;
    }
    else {
        var mydata = csvData.join('\n');
        if(options.transform_gt_lt){
            mydata=sinri_recover_gt_and_lt(mydata);
        }
        return 'data:text/csv;charset=utf8,' + encodeURIComponent(mydata);
    }

    function sinri_recover_gt_and_lt(input){
        return input.replace(/&gt;/g,'>').replace(/&lt;/g,'<');;
    }

    function row2CSV(tmpRow) {
        var tmp = tmpRow.join('') // to remove any blank rows

        if (tmpRow.length > 0 && tmp != '') {
            var mystr = tmpRow.join(options.separator);
            csvData[csvData.length] = mystr;
        }
    }
    function formatData(input) {
        var output = input.replace(/["]/g, "“").replace(/&nbsp;/gi,' ').replace(/\<[^\<]+\>/g, "");
        
        return (output == '' ? '': '"' + output.trim() + '"');
    }
    function popup(data) {
        var generator = window.open('', 'csv', 'height=400,width=600');
        generator.document.write('<html><head><title>CSV</title>');
        generator.document.write('</head><body >');
        generator.document.write('<textArea cols=70 rows=15 wrap="off" >');
        generator.document.write(data);
        generator.document.write('</textArea>');
        generator.document.write('</body></html>');
        generator.document.close();
        return true;
    }

};
function transtable(t) {
    var newrows = [];
    t.find('thead, tbody').children("tr").each(function(){
        var i = 0;
        $(this).find("td, th").each(function(){
            if(newrows[i] === undefined) { newrows[i] = $("<tr></tr>"); }
            newrows[i].append($(this));
            i++;
        });
    });
    t.find('thead, tbody').children("tr").remove();
    for(let x = 0; x < newrows.length; x++) {
        t.append(newrows[x]);
    }
}

function insertPDF(url, canvas) {
    pdfjsLib.getDocument(url);
    var loadingTask = pdfjsLib.getDocument(url);

    loadingTask.promise.then(function(pdf) {
        //
        // Fetch the first page
        //
        var pages = pdf.numPages;

        var renderPage = function(pageNumber) {
            pdf.getPage(pageNumber).then(function(page) {
                var scale = 1.5;
                var viewport = page.getViewport(scale);
                //
                // Prepare canvas using PDF page dimensions
                //
                // var canvas = document.getElementById('the-canvas');
                var context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                //
                // Render PDF page into canvas context
                //
                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                page.render(renderContext);
            });
        }

        renderPage(1);
        if (pages > 1) {
            var nElBtn = document.createElement('button');
            nElBtn.appendChild(document.createTextNode('Siguiente página'));
            //nElBtn.appendChild(document.createAttribute('data-current'));
            //nElBtn.appendChild(document.createAttribute('data-max'));

            nElBtn.setAttribute('data-current', 1);
            nElBtn.setAttribute('data-max', pages);
            nElBtn.setAttribute('style', 'width: ' + canvas.width + ';');

            nElBtn.classList.add('form-control');

            canvas.previousElementSibling.append(nElBtn);

            nElBtn.onclick = function() {
                var currentPage = Number(this.getAttribute('data-current'));
                var maxPages = Number(this.getAttribute('data-max'))
                if (currentPage + 1 > maxPages) { currentPage = 1; } else { currentPage += 1; }

                renderPage(currentPage);

                this.setAttribute('data-current', currentPage);
            };
        }
    });
}