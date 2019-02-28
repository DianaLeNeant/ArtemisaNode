var db = require('db');
var artemisa = require('artemisa');
function cGen(alpha = '1') {
    var r = Math.floor(Math.random() * 256);
    var g = Math.floor(Math.random() * 256);
    var b = Math.floor(Math.random() * 256);

    return String('rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha +')');
}

/**
 * Graph data for users / askings.
 * @param {Function} callBack
 */
function graphAsk(callBack = function( data = { label: String(), data: String(), colors: String(), labels: String(), length: Number() } ) {}, filter = {column: '', filter: ''}) {
    db.query('SELECT ID, Nombre, Acceso FROM usuarios;', function (resEsp) {
        var cEsp = 0;
        var colors = [];
        var espCount = [];
        var resEspL = [];
        
        var addCount = function(caption, qnt = 0) {
            var co = resEspL.indexOf(caption);

            if (co > -1) {
                espCount[co] += qnt;
            } else {
                espCount.push(qnt);
                colors.push(cGen(0.8));
                resEspL.push(caption);
            }
        }

        var qC = function(esp) {
            if (esp > resEsp.length - 1) {
                ret();
            } else {
                //if (!resEsp[esp]) qC(esp + 1);
                db.query('SELECT ID FROM cmm_cotizaciones WHERE Ejecutivo = "' + resEsp[esp].ID + '"' + (filter.filter != '' ? ' AND Fecha BETWEEN \'' + filter.filter + '\'' : '') + ';', function (resEspA) {
                    var area = artemisa.consultAreas(resEsp[esp].Acceso);
                    
                    if (area) {
                        if (area.flags.includes('mute') || area.isAdmon) {
                            qC(esp + 1);
                        } else {
                            addCount(artemisa.secureParse(resEsp[esp].Nombre)[0], resEspA.length);
                            qC(esp + 1);
                        }
                    } else {
                        qC(esp + 1);
                    }
                });
            }
        }

        var ret = function() {
            callBack({
                label: 'Cantidad de Cotizaciones por Ejecutivo',
                data: JSON.stringify(espCount).replace(/"/g, "'"),
                colors: JSON.stringify(colors).replace(/"/g, "'"),
                labels: JSON.stringify(resEspL).replace(/"/g, "'"),
                length: resEspL.length
            });
        }

        qC(cEsp);
    });
}
/**
 * Graph data for users / sales.
 * @param {Function} callBack
 */
function graphSales(callBack = function( data = { label: String(), data: String(), colors: String(), labels: String(), length: Number() } ) {}, filter = {column: '', filter: ''}) {
    db.query('SELECT ID, Nombre, Acceso FROM usuarios;', function (resEsp) {
        var cEsp = 0;
        var colors = [];
        var espCount = [];
        var resEspL = [];

        var addCount = function(caption, qnt = 0) {
            var co = resEspL.indexOf(caption);

            if (co > -1) {
                espCount[co] += qnt;
            } else {
                espCount.push(qnt);
                colors.push(cGen(0.8));
                resEspL.push(caption);
            }
        }

        var qC = function(esp) {
            if (esp > resEsp.length - 1) {
                ret();
            } else {
                db.query('SELECT ID, Total FROM cmm_ventas WHERE Ejecutivo = ' + resEsp[esp].ID + (filter.filter != '' ? ' AND Fecha BETWEEN \'' + filter.filter + '\'' : '') + ';', function (resEspA) {
                    var area = artemisa.consultAreas(resEsp[esp].Acceso);
                    
                    if (area) {
                        if (area.flags.includes('mute') || area.isAdmon) {
                            qC(esp + 1);
                        } else {
                            addCount(artemisa.secureParse(resEsp[esp].Nombre)[0], resEspA.length);
                            qC(esp + 1);
                        }
                    } else {
                        qC(esp + 1);
                    }
                });
            }
        }

        var ret = function() {
            callBack({
                label: 'Cantidad de Ventas por Ejecutivo',
                data: JSON.stringify(espCount).replace(/"/g, "'"),
                colors: JSON.stringify(colors).replace(/"/g, "'"),
                labels: JSON.stringify(resEspL).replace(/"/g, "'"),
                length: resEspL.length
            });
        }

        qC(cEsp);
    });
}
/**
 * Graph data for users / clients
 * @param {Function} callBack
 */
function graphClientsExe(callBack = function( data = { label: String(), data: String(), colors: String(), labels: String(), length: Number() } ) {}, filter = {column: '', filter: ''}) {
    db.query('SELECT ID, Nombre, Acceso FROM usuarios;', function (resEsp) {
        var cEsp = 0;
        var colors = [];
        var espCount = [];
        var resEspL = [];

        var addCount = function(caption, qnt = 0) {
            var co = resEspL.indexOf(caption);

            if (co > -1) {
                espCount[co] += qnt;
            } else {
                espCount.push(qnt);
                colors.push(cGen(0.8));
                resEspL.push(caption);
            }
        }

        var qC = function(esp) {
            if (esp > resEsp.length - 1) {
                ret();
            } else {
                //if (!resEsp[esp]) qC(esp + 1);
                db.query('SELECT ID, Nombre FROM cmm_clientes WHERE Ejecutivo = "' + resEsp[esp].ID + '"' + (filter.filter != '' ? ' AND Creacion BETWEEN \'' + filter.filter + '\'' : '') + ';', function (resEspA) {
                    var area = artemisa.consultAreas(resEsp[esp].Acceso);
                    
                    if (area) {
                        if (area.flags.includes('mute') || area.isAdmon) {
                            qC(esp + 1);
                        } else {
                            addCount(artemisa.secureParse(resEsp[esp].Nombre)[0], resEspA.length);
                            qC(esp + 1);
                        }
                    } else {
                        qC(esp + 1);
                    }
                });
            }
        }

        var ret = function() {
            callBack({
                label: 'Cantidad de Clientes por Ejecutivo',
                data: JSON.stringify(espCount).replace(/"/g, "'"),
                colors: JSON.stringify(colors).replace(/"/g, "'"),
                labels: JSON.stringify(resEspL).replace(/"/g, "'"),
                length: resEspL.length
            });
        }

        qC(cEsp);
    });
}
/**
 * Graph data for users / answers percent
 * @param {Function} callBack
 */
function graphClientsAsk(callBack = function( data = { label: String(), data: String(), colors: String(), labels: String(), length: Number() } ) {}, filter = {column: '', filter: ''}) {
    db.query('SELECT ID, Nombre, Acceso FROM usuarios;', function (resEsp) {
        var cEsp = 0;
        var colors = [];
        var espCount = [];
        var resEspL = [];

        var addCount = function(caption, qnt = 0) {
            var co = resEspL.indexOf(caption);

            if (co > -1) {
                espCount[co] += qnt;
            } else {
                espCount.push(qnt);
                colors.push(cGen(0.8));
                resEspL.push(caption);
            }
        }

        var qC = function(esp) {
            if (esp > resEsp.length - 1) {
                ret();
            } else {
                //if (!resEsp[esp]) qC(esp + 1);
                db.query(`SELECT ID FROM cmm_clientes WHERE Ejecutivo = ${resEsp[esp].ID}${(filter.filter != '' ? ' AND Creacion BETWEEN \'' + filter.filter + '\'' : '')};`, function (resEspX) {
                    db.query('SELECT ID, Cliente FROM cmm_cotizaciones WHERE Ejecutivo = ' + resEsp[esp].ID + (filter.filter != '' ? ' AND Fecha BETWEEN \'' + filter.filter + '\'' : '') + ';', function (resEspA) {
                        var tCl = (resEspX ? resEspX.length : 0);
                        var tCt = 0;

                        for (let y = 0; y < tCl; y++) {
                            var tClient = resEspX[y].ID;
                            for (let x = 0; x < resEspA.length; x++) {
                                var tAsk = resEspA[x].Cliente;
                                if (tAsk == tClient) {
                                    tCt += 1; break;
                                }
                            }
                        }

                        var percent = Math.ceil((tCt * 100) / tCl);

                        var area = artemisa.consultAreas(resEsp[esp].Acceso);
                    
                        if (area) {
                            if (area.flags.includes('mute') || area.isAdmon) {
                                qC(esp + 1);
                            } else {
                                addCount(artemisa.secureParse(resEsp[esp].Nombre)[0], (percent ? percent : 0));
                                qC(esp + 1);
                            }
                        } else {
                            qC(esp + 1);
                        }
                    });
                });
            }
        }

        var ret = function() {
            callBack({
                label: 'Porcentaje de Cotizaciones por Clientes',
                data: JSON.stringify(espCount).replace(/"/g, "'"),
                colors: JSON.stringify(colors).replace(/"/g, "'"),
                labels: JSON.stringify(resEspL).replace(/"/g, "'"),
                length: resEspL.length
            });
        }

        qC(cEsp);
    });
}

/**
 * Graph data for state origin / clients
 * @param {Function} callBack
 */
function graphAutoClients(callBack = function( data = { label: String(), data: String(), colors: String(), labels: String(), length: Number() } ) {}, filter = {column: '', filter: ''}) {
    db.query('SELECT ID, CTelefono, Tags FROM cmm_clientes WHERE Tags LIKE "%auto%"' + (filter.filter != '' ? ' AND Creacion BETWEEN \'' + filter.filter + '\'' : '') + ';', function (resEsp) {
        var cEsp = 0;
        var colors = [];
        var espCount = [];
        var resEspL = [];

        if (!resEsp.length > 0) ret();

        var cleanTel = function (tel, addPrefix = false) {
            if (!tel) return '';
            if (tel == '') return '';
            if (!String(tel).match(/[0-9]/g)) return '';

            var ret = (addPrefix ? String(artemisa.consultConfiguration('sms', 'defaultSMSNumberPrefix')) : '') + String(String(tel).match(/[0-9]/g).join('')).replace(/^01|^044|^045|^521|^5201|^52/g, '');

            return ret;
        }

        var addCount = function(estado) {
            var co = resEspL.indexOf(estado);

            if (co > -1) {
                espCount[co] += 1;
            } else {
                espCount.push(1);
                colors.push(cGen(0.8));
                resEspL.push(estado);
            }
        }

        var qC = function(esp) {
            if (esp > resEsp.length - 1) {
                ret();
            } else {
                //if (!resEsp[esp]) qC(esp + 1);

                var tel = resEsp[esp].CTelefono;
                var estado = 'Sin identificar';

                var lada = String(cleanTel(tel)).slice(2, 5);
                if (lada) {
                    db.query(`SELECT Nombre, LADA FROM lada WHERE LADA LIKE '${lada}%';`, function(resL) {
                        if (resL) { if (resL.length > 0) {
                            estado = String(resL[0].Nombre).split(',')[1];
                            if (estado) addCount(estado);

                            qC(esp + 1);
                        } else {
                            db.query(`SELECT Nombre, LADA FROM lada WHERE LADA LIKE '${lada.slice(0, 2)}%';`, function(resL) {
                                if (resL) { if (resL.length > 0) {
                                    estado = String(resL[0].Nombre).split(',')[1];
                                    if (estado) addCount(estado);

                                    qC(esp + 1);
                                } else {
                                    //addCount(estado);
                                    qC(esp + 1);
                                }}
                            });
                        }} else {
                            //addCount(estado);
                            qC(esp + 1);
                        }
                    });
                } else {
                    //addCount(estado);
                    qC(esp + 1);
                }
            }
        }

        var ret = function() {
            callBack({
                label: 'Estado de Origen',
                data: JSON.stringify(espCount).replace(/"/g, "'"),
                colors: JSON.stringify(colors).replace(/"/g, "'"),
                labels: JSON.stringify(resEspL).replace(/"/g, "'"),
                length: resEspL.length
            });
        }

        qC(cEsp);
    });
}
/**
 * Graph data for origin / clients
 * @param {Function} callBack
 */
function graphAutoClientsOrigin(callBack = function( data = { label: String(), data: String(), colors: String(), labels: String(), length: Number() } ) {}, filter = {column: '', filter: ''}) {
    db.query('SELECT ID, CTelefono, Tags FROM cmm_clientes WHERE Tags LIKE "%auto%"' + (filter.filter != '' ? ' AND Creacion BETWEEN \'' + filter.filter + '\'' : '') + ';', function (resEsp) {
        var cEsp = 0;
        var colors = [];
        var espCount = [];
        var resEspL = [];

        if (!resEsp.length > 0) ret();

        var addCount = function(estado) {
            var co = resEspL.indexOf(estado);

            if (co > -1) {
                espCount[co] += 1;
            } else {
                espCount.push(1);
                colors.push(cGen(0.8));
                resEspL.push(estado);
            }
        }

        var qC = function(esp) {
            if (esp > resEsp.length - 1) {
                ret();
            } else {
                //if (!resEsp[esp]) qC(esp + 1);

                var origin = artemisa.secureParse(resEsp[esp].Tags);

                if (origin) {
                    if (origin[1]) {
                        if (isNaN(origin[1])) {
                            addCount(origin[1]);
                        } else {
                            if (origin[2]) {
                                addCount(origin[2]);
                            }
                        }
                    }
                }

                qC(esp + 1);
            }
        }

        var ret = function() {
            callBack({
                label: 'Origen del Prospecto',
                data: JSON.stringify(espCount).replace(/"/g, "'"),
                colors: JSON.stringify(colors).replace(/"/g, "'"),
                labels: JSON.stringify(resEspL).replace(/"/g, "'"),
                length: resEspL.length
            });
        }

        qC(cEsp);
    });
}
/**
 * Graph data for state origin / product category
 * @param {Function} callBack
 */
function graphAutoClientsOriginSource(callBack = function( data = { label: String(), data: String(), colors: String(), labels: String(), length: Number() } ) {}, filter = {column: '', filter: ''}, ultrasource = false) {
    db.query('SELECT ID, CTelefono, Tags, Notas FROM cmm_clientes WHERE Tags LIKE "%auto%"' + (filter.filter != '' ? ' AND Creacion BETWEEN \'' + filter.filter + '\'' : '') + ';', function (resEsp) {
        var cEsp = 0;
        var colors = [];
        var espCount = [];
        var resEspL = [];

        if (!resEsp.length > 0) ret();

        var cleanTel = function (tel, addPrefix = false) {
            if (!tel) return '';
            if (tel == '') return '';
            if (!String(tel).match(/[0-9]/g)) return '';

            var ret = (addPrefix ? String(artemisa.consultConfiguration('sms', 'defaultSMSNumberPrefix')) : '') + String(String(tel).match(/[0-9]/g).join('')).replace(/^01|^044|^045|^521|^5201|^52/g, '');

            return ret;
        }

        var setCount = function(estado) {
            var co = resEspL.indexOf(estado);

            if (co == -1) {
                espCount.push(0);
                colors.push(cGen(0.8));
                resEspL.push(estado);
            }
        }
        var addCount = function(estado) {
            var co = resEspL.indexOf(estado);

            if (co > -1) {
                espCount[co] += 1;
            } else {
                espCount.push(1);
                colors.push(cGen(0.8));
                resEspL.push(estado);
            }
        }

        var getOriginUltraSource = function (index) {
            var origin = artemisa.secureParse(resEsp[index].Tags);
            var source = undefined;

            if (origin) {
                if (origin[1]) {
                    if (isNaN(origin[1])) {
                        source = artemisa.consultConfiguration('autoasign', origin[1]);
                    } else {
                        if (origin[2]) {
                            source = artemisa.consultConfiguration('autoasign', origin[2]);
                        }
                    }
                }
            }

            if (source != undefined) {
                if (source.ultrasource != undefined) {
                    return source.ultrasource;
                } else {
                    return (String(resEsp[index].Notas).trim().toLowerCase().includes('ultraso'));
                }
            } else {
                return (String(resEsp[index].Notas).trim().toLowerCase().includes('ultraso'));
            }
        }

        var qC = function(esp) {
            if (esp > resEsp.length - 1) {
                ret();
            } else {
                //if (!resEsp[esp]) qC(esp + 1);

                var tel = resEsp[esp].CTelefono;
                var estado = 'Sin identificar';

                var isUltraSource = getOriginUltraSource(esp);

                var lada = String(cleanTel(tel)).slice(2, 5);
                if (lada) {
                    db.query(`SELECT Nombre, LADA FROM lada WHERE LADA LIKE '${lada}%';`, function(resL) {
                        if (resL) { if (resL.length > 0) {
                            estado = String(resL[0].Nombre).split(',')[1];

                            if (estado) {
                                setCount(estado);
                                if (isUltraSource && ultrasource) {
                                    addCount(estado);
                                } else if (!isUltraSource && !ultrasource) {
                                    addCount(estado);
                                }
                            }
                            qC(esp + 1);
                        } else {
                            db.query(`SELECT Nombre, LADA FROM lada WHERE LADA LIKE '${lada.slice(0, 2)}%';`, function(resL) {
                                if (resL) { if (resL.length > 0) {
                                    estado = String(resL[0].Nombre).split(',')[1];

                                    if (estado) {
                                        setCount(estado);
                                        if (isUltraSource && ultrasource) {
                                            addCount(estado);
                                        } else if (!isUltraSource && !ultrasource) {
                                            addCount(estado);
                                        }
                                    }
                                    qC(esp + 1);
                                } else {
                                    //addCount(estado);
                                    qC(esp + 1);
                                }}
                            });
                        }} else {
                            //addCount(estado);
                            qC(esp + 1);
                        }
                    });
                } else {
                    //addCount(estado);
                    qC(esp + 1);
                }
            }
        }

        var ret = function() {
            callBack({
                label: (ultrasource ? 'Ultrasonidos por Estado' : 'Equipamiento Médico por Estado'),
                data: JSON.stringify(espCount).replace(/"/g, "'"),
                colors: JSON.stringify(colors).replace(/"/g, "'"),
                labels: JSON.stringify(resEspL).replace(/"/g, "'"),
                length: resEspL.length
            });
        }

        qC(cEsp);
    });
}
/**
 * Graph data for specialty / clients
 * @param {Function} callBack
 */
function graphClients(callBack = function( data = { label: String(), data: String(), colors: String(), labels: String(), length: Number() } ) {}, filter = {column: '', filter: ''}) {
    db.query('SELECT ID, Nombre FROM cmm_cespecialidades WHERE NOT ID = "1";', function (resEsp) {
        var cEsp = 0;
        var colors = [];
        var espCount = [];
        var resEspL = [];

        var qC = function(esp) {
            if (esp > resEsp.length - 1) {
                ret();
            } else {
                //if (!resEsp[esp]) qC(esp + 1);
                db.query('SELECT ID, Nombre FROM cmm_clientes WHERE Subcategoria = "' + resEsp[esp].ID + '"' + (filter.filter != '' ? ' AND Creacion BETWEEN \'' + filter.filter + '\'' : '') + ';', function (resEspA) {
                    if (resEspA.length > 0) {
                        espCount.push(resEspA.length);
                        colors.push(cGen(0.8));
                        resEspL.push(resEsp[esp].Nombre);
                    }
                    qC(esp + 1);
                });
            }
        }

        var ret = function() {
            callBack({
                label: 'Cantidad de Clientes por Especialidad',
                data: JSON.stringify(espCount).replace(/"/g, "'"),
                colors: JSON.stringify(colors).replace(/"/g, "'"),
                labels: JSON.stringify(resEspL).replace(/"/g, "'"),
                length: resEspL.length
            });
        }

        qC(cEsp);
    });
}
/**
 * Graph data for product key / appareances at sales
 * @param {Function} callBack
 */
function graphProducts(callBack = function( data = { label: String(), data: String(), colors: String(), labels: String(), length: Number() } ) {}, filter = {column: '', filter: ''}) {
    db.query('SELECT ID, Productos FROM cmm_ventas' + (filter.filter != '' ? ' WHERE Fecha BETWEEN \'' + filter.filter + '\'' : '') + ';', function (resEsp) {
        var cEsp = 0;
        var colors = [];
        var espCount = [];
        var resEspL = [];

        for (let x = 0; x < resEsp.length; x++) {
            var pr = artemisa.secureParse(resEsp[x].Productos);

            if (pr) {
                for (let y = 0; y < pr.length; y++) {
                    if (pr[y].length > 0) {
                        var Clave, Cantidad;
                        if (pr[y][0].includes('status:')) {
                            Clave = String(pr[y][2]);
                            Cantidad = Number(pr[y][7]);
                        } else {
                            Clave = String(pr[y][1]);
                            Cantidad = Number(pr[y][6]);
                        }

                        if (!Clave || !Cantidad) continue;

                        if (!resEspL.includes(Clave)) {
                            espCount.push(Cantidad);
                            colors.push(cGen(0.8));
                            resEspL.push(Clave);
                        } else {
                            var tIndex = resEspL.indexOf(Clave);

                            espCount[tIndex] += Cantidad;
                        }
                    }
                }
            }
        }

        callBack({
            label: 'Productos en Remisión',
            data: JSON.stringify(espCount).replace(/"/g, "'"),
            colors: JSON.stringify(colors).replace(/"/g, "'"),
            labels: JSON.stringify(resEspL).replace(/"/g, "'"),
            length: resEspL.length
        });
    });
}

function getPre(data, filter = {column: '', area: ''}, graphType = 'horizontalBar') {
    if (Array.isArray(data)) {
        var datasets = '';
        var totalLabels = [];
        var debug = '';

        for (let x = 0; x < data.length; x++) {
            var labels = artemisa.secureParse(String(data[x].labels).replace(/'/g, '"'));
            //debug += `${String(data[x].labels).replace(/'/g, '"')}`;
            if (labels && Array.isArray(labels)) {
                for (let z = 0; z < labels.length; z++) {
                    if (totalLabels.indexOf(labels[z]) < 0) {
                        totalLabels.push(labels[z]);
                    } else {
                        //debug += labels[z] + '\n';
                    }
                }
            } else {
                //debug += String(labels.constructor) + '\n';
            }
            var xColor = [];
            var yColor = cGen(0.8);
            for (let y = 0; y < data[x].length; y++) {
                xColor.push(yColor);

            }

            datasets += `{
                label: '${data[x].label}',
                data: ${data[x].data},
                backgroundColor: ${JSON.stringify(xColor).replace(/"/g, "'")},
                borderColor: ${JSON.stringify(xColor).replace(/"/g, "'")},
                borderWidth: 1
            }${x < data.length - 1 ? ',' : ''}`;
        }

        return String(`<button class="action" data-action="dateTimeFilter.${filter.area}.${filter.filter}">Filtro de fechas</button>
                    <canvas id='myChart' style='width: 800px; height: 1600px;'></canvas>
                    <script>
                        var ctx = document.getElementById('myChart');
                        var myChart = new Chart(ctx, {
                            type: '${graphType}',
                            data: {
                                labels: ${JSON.stringify(totalLabels).replace(/"/g, "'")},
                                datasets: [${datasets}]
                            },
                            options: {
                                scales: {
                                    yAxes: [{
                                        ticks: {
                                            beginAtZero:true
                                        }
                                    }]
                                }
                            },
                            onAnimationComplete: function () {

                                var ctx = this.chart.ctx;
                                ctx.font = this.scale.font;
                                ctx.fillStyle = this.scale.textColor;
                                ctx.textAlign = "center";
                                ctx.textBaseline = "bottom";

                                this.datasets.forEach(function (dataset) {
                                    dataset.bars.forEach(function (bar) {
                                        ctx.fillText(bar.value, bar.x, bar.y - 5);
                                    });
                                });
                            }
                        });

                        var dS = [${datasets}];
                        var nArr = [];

                        for (let x = 0; x < dS.length; x++) {
                            nArr = [];
                            nArr.push(${JSON.stringify(totalLabels).replace(/"/g, "'")});
                            nArr.push(dS[x].data);

                            var tbl = $(tableHtmlize(nArr));
                            var id = tbl.attr('id');

                            $(tbl).insertAfter(ctx);
                            transtable($('#' + id));
                            $('<h3>' + dS[x].label + '</h3>').insertBefore('#' + id);
                        }
                    </script><code>${debug}</code>`).replace(/\n/g, '').replace(/\t/g, '').replace(/  /g, '');
    } else {
        return String(`<button class="action" data-action="dateTimeFilter.${filter.area}.${filter.column}">Filtro de fechas</button>
                    <canvas id='myChart' style='width: 800px; height: 800px;'></canvas>
                    <script>
                        var ctx = document.getElementById('myChart');
                        var myChart = new Chart(ctx, {
                            type: '${graphType}',
                            data: {
                                labels: ${data.labels},
                                datasets: [{
                                    label: '${data.label}',
                                    data: ${data.data},
                                    backgroundColor: ${data.colors},
                                    borderColor: ${data.colors},
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                scales: {
                                    yAxes: [{
                                        ticks: {
                                            beginAtZero:true
                                        }
                                    }]
                                }
                            },

                            onAnimationComplete: function () {

                                var ctx = this.chart.ctx;
                                ctx.font = this.scale.font;
                                ctx.fillStyle = this.scale.textColor;
                                ctx.textAlign = "center";
                                ctx.textBaseline = "bottom";

                                this.datasets.forEach(function (dataset) {
                                    dataset.bars.forEach(function (bar) {
                                        ctx.fillText(bar.value, bar.x, bar.y - 5);
                                    });
                                });
                            }
                        });

                        var tbl = $(tableHtmlize([${data.labels},${data.data}]));
                        var id = tbl.attr('id');

                        $(tbl).insertAfter(ctx);
                        transtable($('#' + id));
                        $('<h3>${data.label}</h3>').insertBefore('#' + id);
                    </script>`).replace(/\n/g, '').replace(/\t/g, '').replace(/  /g, '');
    }
}

module.exports = {
    home: 'exe',
    current: 'home',
    Page: function(section, callBack, filter = null, userID = 1) {
        var queries = [];
        if (filter == null) {
            filter = {
                column: '',
                filter: '',
                area: section
            }
        }
        this.current = section;
        switch (section) {
            case 'home':
                this.Home(callBack, filter);
                break;
            case 'dir':
                callBack({command: 'directory'});
                break;

            case 'exe':
                filter.column =
                graphSales(function(data0) {
                    graphAsk(function(data1) {
                        graphClientsAsk(function(data2) {
                            graphClientsExe(function(data3) {
                                callBack({
                                    pre: getPre([data0, data1, data2, data3], filter)
                                });
                            }, filter);
                        }, filter);
                    }, filter);
                }, filter);
                break;
            case 'autoClientsOrigin':
                graphAutoClientsOrigin(function(data) {
                    callBack({
                        pre: getPre(data, filter)
                    });
                }, filter);
                break;
            case 'autoClientsOriginSource':
                graphAutoClients(function(data0) {
                    graphAutoClientsOriginSource(function(data1) {
                        graphAutoClientsOriginSource(function(data2) {
                            callBack({
                                pre: getPre([data0, data1, data2], filter)
                            });
                        }, filter, false);
                    }, filter, true);
                }, filter);
                break;
            case 'specialty':
                graphClients(function(data) {
                    callBack({
                        pre: getPre(data, filter)
                    });
                }, filter);
                break;

            case 'sales':
                graphProducts(function(data) {
                    callBack({
                        pre: getPre(data, filter)
                    });
                }, filter);
                break;
            default:
                this.current = 'home';
                break;
        }
    },
    Home: function(resultCallBack, filter = null, userID = 1) {
        this.Page(this.home, resultCallBack, filter, userID);
    }
}