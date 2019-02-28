function htmlize(obj = {}, classes = '') {
    /*
        m_key = category name
        s_key = subcategory name or product array
    */
    var nm = nameGen();
    var main_keys = Object.keys(obj);
    main_keys.splice(main_keys.indexOf('prDescriptor'), 1);
    main_keys.splice(main_keys.indexOf('prColumns'), 1);
    main_keys.splice(main_keys.indexOf('prClass'), 1);
    if (obj.pos != undefined) main_keys.splice(main_keys.indexOf('pos'), 1);
    var descriptor = obj.prDescriptor;
    var columns = obj.prColumns;
    var prclass = obj.prClass;
    var filter = {
        type: 'arr',
        data: []
    };
    var ret = '';
    if (obj.pre != undefined) {
        main_keys.splice(main_keys.indexOf('pre'), 1);
        ret = obj.pre + `<div class="row"><div id="${nm}" class="treeView col-4" data-prclass='item result ${prclass}' data-columns='${JSON.stringify(columns)}'><ul id="ul${nm}">`;
    } else {
        ret = `<div class="row"><div id="${nm}" class="treeView col-4" data-prclass='item result ${prclass}' data-columns='${JSON.stringify(columns)}'><ul id="ul${nm}">`;
    }
    for (let x = 0; x < main_keys.length; x++) {
        const m_key = main_keys[x];
        var m_key_keys = Object.keys(obj[m_key]);
        ret += `<li>${m_key}`;
        for (let y = 0; y < m_key_keys.length; y++) {
            const s_key = obj[m_key][m_key_keys[y]];
            ret += `<ul>`;
            if (Array.isArray(s_key)) {
                for (let z = 0; z < s_key.length; z++) {
                    const product = s_key[z];
                    ret += `<li data-pr='${JSON.stringify(product)}' data-jstree='{"icon":"product.png"}'>${product[descriptor]}</li>`;
                    filter.data.push(product);
                }
                ret += '</ul>'
            } else {
                var s_key_keys = Object.keys(s_key);
                for (let z = 0; z < s_key_keys.length; z++) {
                    const s_key_key = s_key_keys[z];
                    ret +=  `<li>${s_key_key}` +
                            `<ul>`;
                    const pr_l = s_key[s_key_key];
                    for (let index = 0; index < pr_l.length; index++) {
                        const product = pr_l[index];
                        ret += `<li data-pr='${JSON.stringify(product)}' data-jstree='{"icon":"product.png"}'>${product[descriptor]}</li>`;
                        filter.data.push(product);
                    }
                    ret += '</ul></li>';
                }
                ret += '</ul>'
            }
        }
        ret += '</li>'
    }
    if (obj.pos != undefined) {
        ret += `</ul></div><div class="col-8 overcon" id='con${nm}'></div></div>` + obj.pos;
    } else {
        ret += `</ul></div><div class="col-8 overcon" id='con${nm}'></div></div>`;
    }
    bindSeekers($('#filtered'), filter);
    delete filter;
    return ret;
}

function tableHtmlize(obj = undefined, classes = '', res_class = '') {
    var ret = `<table id='${nameGen()}' class='${classes}'><thead class="header"><tr>`;

    /*
        ths = {
            "header": "properties..."
        }
    */
    var ths = {};
    /*
        rows = {
            "header": [tds ...]
        }
    */
    var rows = {};

    var testString = function(str) {
            var ret = str;
            if (str.includes('uploads/')) {
                ret = `<a class="ar" href="${str}" target="_blank">${str.split('/')[1].split('.').reverse()[1].split('-').reverse()[0]}</a>`;
                console.log(ret);
            } else {
                var dte = datetimeSQL(new Date(str));
                if (!str.includes('T00:00:00.000') && !isNaN(dte)) {
                    ret = dte;
                } else {
                    ret = dateSQL(dte);
                }
            }
            return ret;
        }

    if (obj) {
        var recO = undefined;
        switch (obj.constructor) {
            case Object:
                var keysO = Object.keys(obj);
                for (let h = 0; h < keysO.length; h++) {
                    var element = obj[keysO[h]];
                    rows[keysO[h]] = [];
                    ths[keysO[h]] = `class="${res_class}"`;
                    switch (element.constructor) {
                        case Object:
                            rows[keysO[h]].push(collapsibleContent(tableHtmlize(element)));
                        break;
                        case Array:
                            rows[keysO[h]].push(collapsibleContent(tableHtmlize(element)));
                        break;
                        case String:
                            if (element.includes('status:')) {
                                ths[keysO[h]] = `title="${tde.split(':')[1]}" class="${res_class}"`;
                            } else {
                                rows[keysO[h]].push(testString(element));
                            }
                        break;
                    }
                }
            break;
            case Array:
                
            break;
            case String:
                recO = secureParse(obj);
                if (recO) {
                    tableHtmlize(recO);
                } else {

                }
            break;
        }
    }

    

    bindSeekers();
    processInputs();
    return ret
}