var db = require('db');
module.exports = {
    home: 'empleados',
    current: 'home',
    Page: function(section, callBack, filter = null, userID = 1) {
        var queries = [];
        if (filter == null) {
            filter = {
                column: '',
                filter: ''
            }
        }
        this.current = section;
        switch (section) {
            case 'home':
                this.Home(callBack, filter);
                break;
            case 'dir':
                callBack({command: 'directory'})
                break;
            case 'empleados':
                queries.push(['SELECT ID, Nombre FROM sucursales {where};', (filter.column == 'Sucursal' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Sucursal']);
                queries.push(['SELECT ID, Nombre FROM puestos {where};', (filter.column == 'Puesto' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Puesto']);
                queries.push(['SELECT ID, Nombre, CURP, RFC, NSS, Nacimiento, Sucursal, Puesto, Sueldo FROM empleados {where};', (!['Puesto', 'Sucursal'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                db.objectize(queries, true, ['ID', 'Nombre', 'CURP', 'RFC', 'NSS', 'Fecha de Nacimiento', 'Sucursal', 'Puesto', 'Sueldo'], 'emplItem admon', 'Nombre', function(ret) {
                    ret.pre = '<button class="action" data-action="form.voidInc">Agregar nueva incidencia</button>';
                    callBack(ret);
                });
                break;
            case "faltas":
                queries.push(['SELECT ID, Nombre FROM empleados {where};', (filter.column == 'Empleado' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Empleado']);
                queries.push(['SELECT * FROM faltas {where};', (filter.column == 'Fecha' ? `Fecha BETWEEN '${filter.filter}'` : ''), '']);
                db.objectize(queries, false, ['ID', 'Empleado', 'Justificante', 'Fecha', 'Observación' ], 'incidItem', 'Fecha',function(ret) {
                    ret.pre = '<button class="action" data-action="form.voidInc">Agregar nueva incidencia</button>' +
                                '<button class="action" data-action="dateFilter.faltas.Fecha">Filtro de fechas</button>';
                    callBack(ret);
                });
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