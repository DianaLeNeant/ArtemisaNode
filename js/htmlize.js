/**
 * Array / Object to HTML content.
 *
 * @link   https://github.com/DianaLeNeant/ArtemisaNode
 * @author Diana Celeste Nuño Ramírez. 2018.
 */

/**
 * Conversion of navigation object to HTML content.
 * 
 * @param {Object} obj Server object to be parsed.
 * @param {String} classes CSS class to add.
 */
function htmlize(obj = {}, classes = '') {
    /*
        m_key = category name
        s_key = subcategory name or product array
    */
    var nm = nameGen();
    var main_keys = Object.keys(obj);
    main_keys.splice(main_keys.indexOf('prDescriptor'), 1);
    main_keys.splice(main_keys.indexOf('prColumns'), 1);
    main_keys.splice(main_keys.indexOf('prColumnsM'), 1);
    main_keys.splice(main_keys.indexOf('prClass'), 1);
    if (obj.pos) main_keys.splice(main_keys.indexOf('pos'), 1);
    var descriptor = obj.prDescriptor;
    var columns = obj.prColumns;
    var columns_m = obj.prColumnsM;
    var prclass = obj.prClass;
    var filter = {
        type: 'arr',
        data: []
    };
    var ret = '';
    if (obj.pre) {
        main_keys.splice(main_keys.indexOf('pre'), 1);
        ret = obj.pre + `<div class="row"><div id="${nm}" class="treeView col-sm-4" data-prclass='item result ${prclass}' data-columns='${JSON.stringify(columns)}'><ul id="ul${nm}">`;
    } else {
        ret = `<div class="row"><div id="${nm}" class="treeView col-sm-4" data-prclass='item result ${prclass}' data-columns='${JSON.stringify(columns)}'><ul id="ul${nm}">`;
    }
    for (let x = 0; x < main_keys.length; x++) {
        var m_key = main_keys[x]; // prev const
        var m_key_keys = Object.keys(obj[m_key]);

        var m_keyO = secureParse(m_key);
        try {
            ret += `<li>${m_keyO[0]}`;
        } catch (error) {
            ret += `<li>${m_key}`;
        }

        for (let y = 0; y < m_key_keys.length; y++) {
            var s_key = obj[m_key][m_key_keys[y]]; // prev const
            ret += `<ul>`;
            if (Array.isArray(s_key)) {
                for (let z = 0; z < s_key.length; z++) {
                    var product = s_key[z]; // prev const
                    var nProd = {}
                    for (let pC = 0; pC < columns_m.length; pC++) {
                        nProd[columns_m[pC]] = (!product[columns_m[pC]] ? '': product[columns_m[pC]])
                    }

                    var prO = secureParse(product[descriptor]);
                    try {
                        ret += `<li data-pr='${JSON.stringify(nProd).replace(/'/g, "&apos;")}' data-jstree='{"icon":"product.png"}'>${prO[0]}</li>`;
                    } catch (error) {
                        ret += `<li data-pr='${JSON.stringify(nProd).replace(/'/g, "&apos;")}' data-jstree='{"icon":"product.png"}'>${product[descriptor]}</li>`;
                    }

                    filter.data.push(product);
                }
                ret += '</ul>'
            } else {
                var s_key_keys = Object.keys(s_key);
                for (let z = 0; z < s_key_keys.length; z++) {
                    var s_key_key = s_key_keys[z]; // prev const

                    var s_key_keyO = secureParse(s_key_key);
                    try {
                        ret +=  `<li>${s_key_keyO[0]}` +
                            `<ul>`;
                    } catch (error) {
                        ret +=  `<li>${s_key_key}` +
                            `<ul>`;
                    }
                    
                    var pr_l = s_key[s_key_key]; // prev const
                    for (let index = 0; index < pr_l.length; index++) {
                        var product = pr_l[index]; // prev const
                        var nProd = {}
                        for (let pC = 0; pC < columns_m.length; pC++) {
                            nProd[columns_m[pC]] = (!product[columns_m[pC]] ? '': product[columns_m[pC]])
                        }

                        var prO = secureParse(product[descriptor]);
                        try {
                            ret += `<li data-pr='${JSON.stringify(nProd).replace(/'/g, "&apos;")}' data-jstree='{"icon":"product.png"}'>${prO[0]}</li>`;
                        } catch (error) {
                            ret += `<li data-pr='${JSON.stringify(nProd).replace(/'/g, "&apos;")}' data-jstree='{"icon":"product.png"}'>${product[descriptor]}</li>`;
                        }

                        filter.data.push(product);
                    }
                    ret += '</ul></li>';
                }
                ret += '</ul>'
            }
        }
        ret += '</li>'
    }
    if (obj.pos) {
        ret += `</ul></div><div class="col-sm overcon" id='con${nm}'></div></div>` + obj.pos;
    } else {
        ret += `</ul></div><div class="col-sm overcon" id='con${nm}'></div></div>`;
    }
    bindSeekers($('#filtered'), filter);
    delete filter;
    return ret;
}

/**
 * Parse object or array to HTML table.
 * 
 * @param {Object} obj Object or Array to be parsed.
 * @param {String} classes CSS classes for the table.
 * @param {String} res_class CSS classes for 'tr' elements.
 * @param {Boolean} recursive Determines if tableHtmlize will be recursive or will invoke listHtmlize instead for each recursive iteration.
 */
function tableHtmlize(obj = {}, classes = '', res_class = '', recursive = true) {
    var ret = `<table id='${nameGen()}' class='${classes}'><thead class="header"><tr>`;
    var extra = '';
    if (Array.isArray(obj)) {
        if (obj.length > 0) {
            if (obj[0].constructor === Object) {
                var heads = Object.keys(obj[0]);
                for (let x = 0; x < heads.length; x++) {
                    const key = heads[x];
                    ret += `<th>${key}</th>`
                }
                ret += '</tr></thead><tbody>';
                for (let index = 0; index < obj.length; index++) {
                    var tr_tmp = '<tr class="' + res_class + '">';
                    var td_tmp = '';
                    const element = obj[index];
                    var e_keys = Object.keys(element);
                    for (let y = 0; y < e_keys.length; y++) {
                        const td = element[e_keys[y]];
                        var tde = td;

                        var o = secureParse(td);
                        if (o) {
                            if (Array.isArray(o) || o.constructor === Object) {
                                if (o.constructor === Object) {
                                    if (o.backtrace) {
                                        tde = `<button class="action" data-action="nprocess.${o.table}.${o.backtrace.insertId}">Revisar Datos</button>`;
                                    } else {
                                        if (recursive) {tde = /*collapsibleContent*/( tableHtmlize(o) );} else {tde = listHtmlize(o);}
                                    }
                                } else {
                                    if (o.length > 0) {
                                        if (o.length > 4) {
                                            if (recursive) {tde = collapsibleContent( tableHtmlize(o) );} else {tde = collapsibleContent( listHtmlize(o) );}
                                        } else {
                                            if (recursive) {tde = tableHtmlize(o);} else {tde = listHtmlize(o);}
                                        }
                                    } else {
                                        console.log(o);
                                        tde = 'Vacío';
                                    }
                                }
                            }
                        } else {
                            if (tde) {
                                if (Array.isArray(tde) || tde.constructor === Object) {
                                    if (tde.constructor === Object) {
                                        if (tde.backtrace) {
                                            tde = `<button class="action" data-action="nprocess.${tde.table}.${tde.backtrace.insertId}">Revisar Datos</button>`;
                                        } else {
                                            if (recursive) {tde = /*collapsibleContent*/( tableHtmlize(tde) );} else {tde = listHtmlize(tde);}
                                        }
                                    } else {
                                        if (tde.length > 0) {
                                            var col = 'Vacío';
                                            if (tde.length > 4) {
                                                if (recursive) {col = collapsibleContent( tableHtmlize(tde) );} else {col = collapsibleContent( listHtmlize(tde) );}
                                            } else {
                                                if (recursive) {col = tableHtmlize(tde);} else {col = listHtmlize(tde);}
                                            }
                                            tde = col;
                                        } else {
                                            console.log(tde);
                                            tde = 'Vacío';
                                        }
                                    }
                                } else {
                                    tde = String(tde);
                                    if (tde == 'undefined') { tde = '' }
                                    if (moment(tde, 'YYYY-MM-DDTHH:mm:ss.SSSSZ', true).isValid()) {
                                        tde = moment(tde).local().format('DD/MM/YYYY HH:mm');
                                    } else
                                        if (tde.includes('status:')) {
                                            tr_tmp = `<tr title="${tde.split(':')[1]}" class="${res_class}">`;
                                        } else {
                                            if (tde.includes('uploads/') && !tde.includes('<img')) {
                                                var tde_t = `<a class="ar onDialog" href="${tde}" target="_blank">${tde.split('/')[1].split('.').reverse()[1].split('-').reverse()[0]}</a>`;
                                                tde = tde_t;
                                            } else {
                                                var dte = datetimeSQL(new Date(tde));
                                                if (!isNaN(dte)) {
                                                    tde = dte;
                                                }
                                            }
                                        }
                                }
                            }
                        }
                        
                        if (e_keys[y].toLowerCase().includes('prec')) extra = 'price';
                        if (e_keys[y].toLowerCase() == 'iva') extra += 'iva';
                        if (e_keys[y].toLowerCase() == 'qnt') extra += 'qnt';
                        /*try {
                            if (!tde.includes('status:')) td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
                        } catch {
                            td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
                        }*/
                        try {
                            if (!tde.includes('status:')) td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
                        } catch {
                            td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
                        }
                        extra = '';
                    }
                    ret += tr_tmp + td_tmp + '</tr>';
                    td_tmp = '';
                    tr_tmp = '<tr class="' + res_class + '">';
                }
                ret += '</tbody></table>'
            } else {
                ret += '<tbody>';
                for (let index = 0; index < obj.length; index++) {
                    const element = obj[index];
                    if (Array.isArray(element)) {
                        for (let y = 0; y < element.length; y++) {
                            var tde = element[y];

                            var o = secureParse(element);
                            if (o) {
                                if (Array.isArray(o) || o.constructor === Object) {
                                    if (o.constructor === Object) {
                                        if (o.backtrace) {
                                            tde = `<button class="action" data-action="nprocess.${o.table}.${o.backtrace.insertId}">Revisar Datos</button>`;
                                        } else {
                                            if (recursive) {tde = /*collapsibleContent*/( tableHtmlize(o) );} else {tde = listHtmlize(o);}
                                        }
                                    } else {
                                        if (o.length > 0) {
                                            if (o.length > 4) {
                                                if (recursive) {tde = collapsibleContent( tableHtmlize(o) );} else {tde = collapsibleContent( listHtmlize(o) );}
                                            } else {
                                                if (recursive) {tde = tableHtmlize(o);} else {tde = listHtmlize(o);}
                                            }
                                        } else {
                                            console.log(o);
                                            tde = 'Vacío';
                                        }
                                    }
                                }
                            } else {
                                if (tde) {
                                    if (Array.isArray(tde) || tde.constructor === Object) {
                                        if (tde.constructor === Object) {
                                            if (tde.backtrace) {
                                                tde = `<button class="action" data-action="nprocess.${tde.table}.${tde.backtrace.insertId}">Revisar Datos</button>`;
                                            } else {
                                                if (recursive) {tde = /*collapsibleContent*/( tableHtmlize(tde) );} else {tde = listHtmlize(tde);}
                                            }
                                        } else {
                                            if (tde.length > 0) {
                                                var col = 'Vacío';
                                                if (tde.length > 4) {
                                                    if (recursive) {col = collapsibleContent( tableHtmlize(tde) );} else {col = collapsibleContent( listHtmlize(tde) );}
                                                } else {
                                                    if (recursive) {col = tableHtmlize(tde);} else {col = listHtmlize(tde);}
                                                }
                                                tde = col;
                                            } else {
                                                console.log(tde);
                                                tde = 'Vacío';
                                            }
                                        }
                                    } else {
                                        tde = String(tde);
                                        if (tde == 'undefined') { tde = '' }
                                        if (moment(tde, 'YYYY-MM-DDTHH:mm:ss.SSSSZ', true).isValid()) {
                                            tde = moment(tde).local().format('DD/MM/YYYY HH:mm');
                                        } else
                                            if (tde.includes('status:')) {
                                                tr_tmp = `<tr title="${tde.split(':')[1]}" class="${res_class}">`;
                                            } else {
                                                if (tde.includes('uploads/') && !tde.includes('<img')) {
                                                    var tde_t = `<a class="ar onDialog" href="${tde}" target="_blank">${tde.split('/')[1].split('.').reverse()[1].split('-').reverse()[0]}</a>`;
                                                    tde = tde_t;
                                                } else {
                                                    var dte = datetimeSQL(new Date(tde));
                                                    if (!isNaN(dte)) {
                                                        tde = dte;
                                                    }
                                                }
                                            }
                                    }
                                }
                            }
                            /*try {
                                if (!tde.includes('status:')) td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
                            } catch {
                                td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
                            }*/
                            try {
                                if (!tde.includes('status:')) td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
                            } catch {
                                td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
                            }
                            extra = '';
                        }
                        ret += tr_tmp + td_tmp + '</tr>';
                        td_tmp = '';
                        tr_tmp = '<tr class="' + res_class + '">';
                    } else {
                        var tde = element;
                        var o = secureParse(element);

                        if (o) {
                            if (Array.isArray(o) || o.constructor === Object) {
                                if (o.constructor === Object) {
                                    if (o.backtrace) {
                                        tde = `<button class="action" data-action="nprocess.${o.table}.${o.backtrace.insertId}">Revisar Datos</button>`;
                                    } else {
                                        if (recursive) {tde = /*collapsibleContent*/( tableHtmlize(o) );} else {tde = listHtmlize(o);}
                                    }
                                } else {
                                    if (o.length > 0) {
                                        if (o.length > 4) {
                                            if (recursive) {tde = collapsibleContent( tableHtmlize(o) );} else {tde = collapsibleContent( listHtmlize(o) );}
                                        } else {
                                            if (recursive) {tde = tableHtmlize(o);} else {tde = listHtmlize(o);}
                                        }
                                    } else {
                                        console.log(o);
                                        tde = 'Vacío';
                                    }
                                }
                            }
                        } else {
                            if (tde) {
                                /*switch (tde.constructor) {
                                    case Array:
                                    break;
                                    case Object:
                                    break;
                                    default:
                                    break;
                                }*/
                                if (Array.isArray(tde) || tde.constructor === Object) {
                                    if (tde.constructor === Object) {
                                        if (tde.backtrace) {
                                            tde = `<button class="action" data-action="nprocess.${tde.table}.${tde.backtrace.insertId}">Revisar Datos</button>`;
                                        } else {
                                            if (recursive) {tde = /*collapsibleContent*/( tableHtmlize(tde) );} else {tde = listHtmlize(tde);}
                                        }
                                    } else {
                                        if (tde.length > 0) {
                                            var col = 'Vacío';
                                            if (tde.length > 4) {
                                                if (recursive) {col = collapsibleContent( tableHtmlize(tde) );} else {col = collapsibleContent( listHtmlize(tde) );}
                                            } else {
                                                if (recursive) {col = tableHtmlize(tde);} else {col = listHtmlize(tde);}
                                            }
                                            tde = col;
                                        } else {
                                            console.log(tde);
                                            tde = 'Vacío';
                                        }
                                    }
                                } else {
                                    tde = String(tde);
                                    if (tde == 'undefined') { tde = '' }
                                    if (moment(tde, 'YYYY-MM-DDTHH:mm:ss.SSSSZ', true).isValid()) {
                                        tde = moment(tde).local().format('DD/MM/YYYY HH:mm');
                                    } else
                                        if (tde.includes('status:')) {
                                            tr_tmp = `<tr title="${tde.split(':')[1]}" class="${res_class}">`;
                                        } else {
                                            if (tde.includes('uploads/') && !tde.includes('<img')) {
                                                var tde_t = `<a class="ar onDialog" href="${tde}" target="_blank">${tde.split('/')[1].split('.').reverse()[1].split('-').reverse()[0]}</a>`;
                                                tde = tde_t;
                                            } else {
                                                var dte = datetimeSQL(new Date(tde));
                                                if (!isNaN(dte)) {
                                                    tde = dte;
                                                }
                                            }
                                        }
                                }
                            }
                        }
                        try {
                            if (!tde.includes('status:')) td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
                        } catch {
                            td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
                        }
                        extra = '';

                        ret += tr_tmp + td_tmp + '</tr>';
                        td_tmp = '';
                        tr_tmp = '<tr class="' + res_class + '">';
                    }
                }
                ret += '</tbody></table>';
                td_tmp = '';
                tr_tmp = '<tr class="' + res_class + '">';
            }
        }
    } else {
        var heads = Object.keys(obj);
        var tr_tmp = '';
        var td_tmp = '';
        for (let x = 0; x < heads.length; x++) {
            const key = heads[x];
            var tde = obj[key];
            var o = secureParse(obj[key]);
            
            if (o) {
                if (Array.isArray(o) || o.constructor === Object) {
                    if (o.constructor === Object) {
                        if (o.backtrace) {
                            tde = `<button class="action" data-action="nprocess.${o.table}.${o.backtrace.insertId}">Revisar Datos</button>`;
                        } else {
                            if (recursive) {tde = /*collapsibleContent*/( tableHtmlize(o) );} else {tde = listHtmlize(o);}
                        }
                    } else {
                        if (o.length > 0) {
                            if (o.length > 4) {
                                if (recursive) {tde = collapsibleContent( tableHtmlize(o) );} else {collapsibleContent( listHtmlize(o) );}
                            } else {
                                if (recursive) {tde = tableHtmlize(o);} else {tde = listHtmlize(o);}
                            }
                        } else {
                            console.log(o);
                            tde = 'Vacío';
                        }
                    }
                }
            } else {
                if (tde) {
                    if (Array.isArray(tde) || tde.constructor === Object) {
                        if (tde.constructor === Object) {
                            if (tde.backtrace) {
                                tde = `<button class="action" data-action="nprocess.${tde.table}.${tde.backtrace.insertId}">Revisar Datos</button>`;
                            } else {
                                if (recursive) {tde = /*collapsibleContent*/( tableHtmlize(tde) );} else {tde = listHtmlize(tde);}
                            }
                        } else {
                            if (tde.length > 0) {
                                var col = 'Vacío';
                                if (tde.length > 4) {
                                    if (recursive) {col = collapsibleContent( tableHtmlize(tde) );} else {col = collapsibleContent( listHtmlize(tde) );}
                                } else {
                                    if (recursive) {col = tableHtmlize(tde);} else {col = listHtmlize(tde);}
                                }
                                tde = col;
                            } else {
                                console.log(tde);
                                tde = 'Vacío';
                            }
                        }
                    } else {
                        tde = String(tde);
                        if (tde == 'undefined') { tde = '' }
                        if (moment(tde, 'YYYY-MM-DDTHH:mm:ss.SSSSZ', true).isValid()) {
                            tde = moment(tde).local().format('DD/MM/YYYY HH:mm');
                        } else
                            if (tde.includes('status:')) {
                                tr_tmp = `<tr title="${tde.split(':')[1]}" class="${res_class}">`;
                            } else {
                                if (tde.includes('uploads/') && !tde.includes('<img')) {
                                    var tde_t = `<a class="ar onDialog" href="${tde}" target="_blank">${tde.split('/')[1].split('.').reverse()[1].split('-').reverse()[0]}</a>`;
                                    tde = tde_t;
                                } else {
                                    var dte = datetimeSQL(new Date(tde));
                                    if (!isNaN(dte)) {
                                        tde = dte;
                                    }
                                }
                            }
                    }
                }
            }

            ret += `<th>${key}</th>`

            if (key.toLowerCase().includes('prec')) extra = 'price';
            if (key.toLowerCase() == 'iva') extra += 'iva';
            if (key.toLowerCase() == 'qnt') extra += 'qnt';
            /*try {
                if (!tde.includes('status:')) td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
            } catch {
                td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
            }*/
            try {
                if (!tde.includes('status:')) td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
            } catch {
                td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
            }
            
            extra = '';
        }
        ret += `</tr></thead><tbody><tr ${(tr_tmp ? tr_tmp : '')} class="${(res_class ? res_class : '')}">${td_tmp}</tr></tbody></table>`;
        td_tmp = '';
        tr_tmp = '';
    }
    //bindSeekers();
    //processInputs();
    return String(ret).replace(/undefined/g, '').replace(/NaN/g, '');
}

/**
 * Converts an Array or Object to a DIV bootstrap grid.
 * 
 * @param {Object} obj Array or Object to be parsed.
 * @param {String} classes Container DIV CSS class.
 * @param {String} res_class Row DIV CSS class.
 */
function listHtmlize(obj = {}, classes = '', res_class = '') {
    var ret = `<div id='${nameGen()}' class='${classes}'><div class='row'>`;
    var extra = '';
    if (Array.isArray(obj)) {
        if (obj.length > 0) {
            if (obj[0].constructor === Object) {
                var heads = Object.keys(obj[0]);
                for (let x = 0; x < heads.length; x++) {
                    const key = heads[x];
                    ret += `<div class='col'>${key}</div>`
                }
                ret += '</div>';
                for (let index = 0; index < obj.length; index++) {
                    var tr_tmp = '<div class="row ' + (res_class ? res_class : '') + '">';
                    var td_tmp = '';
                    const element = obj[index];
                    var e_keys = Object.keys(element);
                    for (let y = 0; y < e_keys.length; y++) {
                        const td = element[e_keys[y]];
                        var tde = td;

                        var o = secureParse(td);
                        if (o) {
                            if (Array.isArray(o) || o.constructor === Object) {
                                if (o.constructor === Object) {
                                    if (o.backtrace) {
                                        tde = `<button class="action" data-action="nprocess.${o.table}.${o.backtrace.insertId}">Revisar Datos</button>`;
                                    } else {
                                        tde = /*collapsibleContent*/( listHtmlize(o) );
                                    }
                                } else {
                                    if (o.length > 0) {
                                        if (o.length > 4) {
                                            tde = collapsibleContent( listHtmlize(o) );
                                        } else {
                                            tde = listHtmlize(o);
                                        }
                                    } else {
                                        console.log(o);
                                        tde = 'Vacío';
                                    }
                                }
                            }
                        } else {
                            if (tde) {
                                if (Array.isArray(tde) || tde.constructor === Object) {
                                    if (tde.constructor === Object) {
                                        if (tde.backtrace) {
                                            tde = `<button class="action" data-action="nprocess.${tde.table}.${tde.backtrace.insertId}">Revisar Datos</button>`;
                                        } else {
                                            tde = /*collapsibleContent*/( listHtmlize(tde) );
                                        }
                                    } else {
                                        if (tde.length > 0) {
                                            var col = 'Vacío';
                                            if (tde.length > 4) {
                                                col = collapsibleContent( listHtmlize(tde) );
                                            } else {
                                                col = listHtmlize(tde);
                                            }
                                            tde = col;
                                        } else {
                                            console.log(tde);
                                            tde = 'Vacío';
                                        }
                                    }
                                } else {
                                    tde = String(tde);
                                    if (tde == 'undefined') { tde = '' }
                                    if (moment(tde, 'YYYY-MM-DDTHH:mm:ss.SSSSZ', true).isValid()) {
                                        tde = moment(tde).local().format('DD/MM/YYYY HH:mm');
                                    } else
                                        if (tde.includes('status:')) {
                                            tr_tmp = `<div title="${tde.split(':')[1]}" class="row ${res_class}">`;
                                        } else {
                                            if (tde.includes('uploads/') && !tde.includes('<img')) {
                                                var tde_t = `<a class="ar onDialog" href="${tde}" target="_blank">${tde.split('/')[1].split('.').reverse()[1].split('-').reverse()[0]}</a>`;
                                                tde = tde_t;
                                            } else {
                                                var dte = datetimeSQL(new Date(tde));
                                                if (!isNaN(dte)) {
                                                    tde = dte;
                                                }
                                            }
                                        }
                                }
                            } else {
                                tde = '';
                            }
                        }
                        
                        if (e_keys[y].toLowerCase().includes('prec')) extra = 'price';
                        if (e_keys[y].toLowerCase() == 'iva') extra += 'iva';
                        if (e_keys[y].toLowerCase() == 'qnt') extra += 'qnt';
                        /*try {
                            if (!tde.includes('status:')) td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
                        } catch {
                            td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
                        }*/
                        try {
                            if (!tde.includes('status:')) td_tmp += `<div class='col ${res_class} ${extra}'>${tde}</div>`;
                        } catch {
                            td_tmp += `<div class='col ${res_class} ${extra}'>${tde}</div>`;
                        }
                        extra = '';
                    }
                    ret += (tr_tmp ? tr_tmp : '') + (td_tmp ? td_tmp : '') + '</div>';
                    td_tmp = '';
                    tr_tmp = '<div class="row ' + (res_class ? res_class : '') + '">';
                }
                ret += '</div>'
            } else {
                for (let index = 0; index < obj.length; index++) {
                    const element = obj[index];
                    if (Array.isArray(element)) {
                        for (let y = 0; y < element.length; y++) {
                            var tde = element[y];

                            var o = secureParse(element);
                            if (o) {
                                if (Array.isArray(o) || o.constructor === Object) {
                                    if (o.constructor === Object) {
                                        if (o.backtrace) {
                                            tde = `<button class="action" data-action="nprocess.${o.table}.${o.backtrace.insertId}">Revisar Datos</button>`;
                                        } else {
                                            tde = /*collapsibleContent*/( listHtmlize(o) );
                                        }
                                    } else {
                                        if (o.length > 0) {
                                            if (o.length > 4) {
                                                tde = collapsibleContent( listHtmlize(o) );
                                            } else {
                                                tde = listHtmlize(o);
                                            }
                                        } else {
                                            console.log(o);
                                            tde = 'Vacío';
                                        }
                                    }
                                }
                            } else {
                                if (tde) {
                                    if (Array.isArray(tde) || tde.constructor === Object) {
                                        if (tde.constructor === Object) {
                                            if (tde.backtrace) {
                                                tde = `<button class="action" data-action="nprocess.${tde.table}.${tde.backtrace.insertId}">Revisar Datos</button>`;
                                            } else {
                                                tde = /*collapsibleContent*/( listHtmlize(tde) );
                                            }
                                        } else {
                                            if (tde.length > 0) {
                                                var col = 'Vacío';
                                                if (tde.length > 4) {
                                                    col = collapsibleContent( listHtmlize(tde) );
                                                } else {
                                                    col = listHtmlize(tde);
                                                }
                                                tde = col;
                                            } else {
                                                console.log(tde);
                                                tde = 'Vacío';
                                            }
                                        }
                                    } else {
                                        tde = String(tde);
                                        if (tde == 'undefined') { tde = '' }
                                        if (moment(tde, 'YYYY-MM-DDTHH:mm:ss.SSSSZ', true).isValid()) {
                                            tde = moment(tde).local().format('DD/MM/YYYY HH:mm');
                                        } else
                                            if (tde.includes('status:')) {
                                                tr_tmp = `<div title="${tde.split(':')[1]}" class="row ${res_class}">`;
                                            } else {
                                                if (tde.includes('uploads/') && !tde.includes('<img')) {
                                                    var tde_t = `<a class="ar onDialog" href="${tde}" target="_blank">${tde.split('/')[1].split('.').reverse()[1].split('-').reverse()[0]}</a>`;
                                                    tde = tde_t;
                                                } else {
                                                    var dte = datetimeSQL(new Date(tde));
                                                    if (!isNaN(dte)) {
                                                        tde = dte;
                                                    }
                                                }
                                            }
                                    }
                                } else {
                                    tde = '';
                                }
                            }
                            /*try {
                                if (!tde.includes('status:')) td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
                            } catch {
                                td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
                            }*/
                            try {
                                if (!tde.includes('status:')) td_tmp += `<div class='col ${res_class} ${extra}'>${tde}</div>`;
                            } catch {
                                td_tmp += `<div class='col ${res_class} ${extra}'>${tde}</div>`;
                            }
                            extra = '';
                        }
                        ret += (tr_tmp ? tr_tmp : '') + (td_tmp ? td_tmp : '') + '</div>';
                        td_tmp = '';
                        tr_tmp = '<div class="row ' + (res_class ? res_class : '') + '">';
                    } else {
                        var tde = element;
                        var o = secureParse(element);

                        if (o) {
                            if (Array.isArray(o) || o.constructor === Object) {
                                if (o.constructor === Object) {
                                    if (o.backtrace) {
                                        tde = `<button class="action" data-action="nprocess.${o.table}.${o.backtrace.insertId}">Revisar Datos</button>`;
                                    } else {
                                        tde = /*collapsibleContent*/( listHtmlize(o) );
                                    }
                                } else {
                                    if (o.length > 0) {
                                        if (o.length > 4) {
                                            tde = collapsibleContent( listHtmlize(o) );
                                        } else {
                                            tde = listHtmlize(o);
                                        }
                                    } else {
                                        console.log(o);
                                        tde = 'Vacío';
                                    }
                                }
                            }
                        } else {
                            if (tde) {
                                /*switch (tde.constructor) {
                                    case Array:
                                    break;
                                    case Object:
                                    break;
                                    default:
                                    break;
                                }*/
                                if (Array.isArray(tde) || tde.constructor === Object) {
                                    if (tde.constructor === Object) {
                                        if (tde.backtrace) {
                                            tde = `<button class="action" data-action="nprocess.${tde.table}.${tde.backtrace.insertId}">Revisar Datos</button>`;
                                        } else {
                                            tde = /*collapsibleContent*/( listHtmlize(tde) );
                                        }
                                    } else {
                                        if (tde.length > 0) {
                                            var col = 'Vacío';
                                            if (tde.length > 4) {
                                                col = collapsibleContent( listHtmlize(tde) );
                                            } else {
                                                col = listHtmlize(tde);
                                            }
                                            tde = col;
                                        } else {
                                            console.log(tde);
                                            tde = 'Vacío';
                                        }
                                    }
                                } else {
                                    tde = String(tde);
                                    if (tde == 'undefined') { tde = '' }
                                    if (moment(tde, 'YYYY-MM-DDTHH:mm:ss.SSSSZ', true).isValid()) {
                                        tde = moment(tde).local().format('DD/MM/YYYY HH:mm');
                                    } else
                                        if (tde.includes('status:')) {
                                            tr_tmp = `<div title="${tde.split(':')[1]}" class="row ${res_class}">`;
                                        } else {
                                            if (tde.includes('uploads/') && !tde.includes('<img')) {
                                                var tde_t = `<a class="ar onDialog" href="${tde}" target="_blank">${tde.split('/')[1].split('.').reverse()[1].split('-').reverse()[0]}</a>`;
                                                tde = tde_t;
                                            } else {
                                                var dte = datetimeSQL(new Date(tde));
                                                if (!isNaN(dte)) {
                                                    tde = dte;
                                                }
                                            }
                                        }
                                }
                            } else {
                                tde = '';
                            }
                        }
                        try {
                            if (!tde.includes('status:')) td_tmp += `<div class='col ${res_class} ${extra}'>${tde}</div>`;
                        } catch {
                            td_tmp += `<div class='col ${res_class} ${extra}'>${tde}</div>`;
                        }
                        extra = '';

                        ret += (tr_tmp ? tr_tmp : '') + (td_tmp ? td_tmp : '') + '</div>';
                        td_tmp = '';
                        tr_tmp = '<div class="row ' + (res_class ? res_class : '') + '">';
                    }
                }
                ret += '</div>';
                td_tmp = '';
                tr_tmp = '<div class="row' + (res_class ? res_class : '') + '">';
            }
        }
    } else {
        var heads = Object.keys(obj);
        var tr_tmp = '';
        var td_tmp = '';
        for (let x = 0; x < heads.length; x++) {
            const key = heads[x];
            var tde = obj[key];
            var o = secureParse(obj[key]);
            
            if (o) {
                if (Array.isArray(o) || o.constructor === Object) {
                    if (o.constructor === Object) {
                        if (o.backtrace) {
                            tde = `<button class="action" data-action="nprocess.${o.table}.${o.backtrace.insertId}">Revisar Datos</button>`;
                        } else {
                            tde = /*collapsibleContent*/( listHtmlize(o) );
                        }
                    } else {
                        if (o.length > 0) {                            
                            if (o.length > 4) {
                                tde = collapsibleContent( listHtmlize(o) );
                            } else {
                                tde = listHtmlize(o);
                            }
                        } else {
                            console.log(o);
                            tde = 'Vacío';
                        }
                    }
                }
            } else {
                if (tde) {
                    if (Array.isArray(tde) || tde.constructor === Object) {
                        if (tde.constructor === Object) {
                            if (tde.backtrace) {
                                tde = `<button class="action" data-action="nprocess.${tde.table}.${tde.backtrace.insertId}">Revisar Datos</button>`;
                            } else {
                                tde = /*collapsibleContent*/( listHtmlize(tde) );
                            }
                        } else {
                            if (tde.length > 0) {
                                var col = 'Vacío';
                                if (tde.length > 4) {
                                    col = collapsibleContent( listHtmlize(tde) );
                                } else {
                                    col = listHtmlize(tde);
                                }
                                tde = col;
                            } else {
                                console.log(tde);
                                tde = 'Vacío';
                            }
                        }
                    } else {
                        tde = String(tde);
                        if (tde == 'undefined') { tde = '' }
                        if (moment(tde, 'YYYY-MM-DDTHH:mm:ss.SSSSZ', true).isValid()) {
                            tde = moment(tde).local().format('DD/MM/YYYY HH:mm');
                        } else
                            if (tde.includes('status:')) {
                                tr_tmp = `<div title="${tde.split(':')[1]}" class="row ${res_class}">`;
                            } else {
                                if (tde.includes('uploads/') && !tde.includes('<img')) {
                                    var tde_t = `<a class="ar onDialog" href="${tde}" target="_blank">${tde.split('/')[1].split('.').reverse()[1].split('-').reverse()[0]}</a>`;
                                    tde = tde_t;
                                } else {
                                    var dte = datetimeSQL(new Date(tde));
                                    if (!isNaN(dte)) {
                                        tde = dte;
                                    }
                                }
                            }
                    }
                } else {
                    tde = '';
                }
            }

            ret += `<div class="col">${key}</div>`

            if (key.toLowerCase().includes('prec')) extra = 'price';
            if (key.toLowerCase() == 'iva') extra += 'iva';
            if (key.toLowerCase() == 'qnt') extra += 'qnt';
            /*try {
                if (!tde.includes('status:')) td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
            } catch {
                td_tmp += `<td class='${res_class} ${extra}'>${tde}</td>`;
            }*/
            try {
                if (!tde.includes('status:')) td_tmp += `<div class='col ${res_class} ${extra}'>${tde}</div>`;
            } catch {
                td_tmp += `<div class='col ${res_class} ${extra}'>${tde}</div>`;
            }
            
            extra = '';
        }
        ret += `</div><div ${(tr_tmp ? tr_tmp : '')} class="row ${(res_class ? res_class : '')}">${(td_tmp ? td_tmp : '')}</div></div>`;
        td_tmp = '';
        tr_tmp = '';
    }
    //bindSeekers();
    //processInputs();
    return String(ret).replace(/undefined/g, '').replace(/NaN/g, '');
}
