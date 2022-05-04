const MergeRecursive = (obj1 = {}, obj2 = {}) => {
    for (let p in obj2) {
        try {
            if (obj2[p].constructor === Object) {
                obj1[p] = MergeRecursive(obj1[p], obj2[p]);
            } else {
                obj1[p] = obj2[p];
            }
        } catch (e) {
            obj1[p] = obj2[p];
        }
    }
    return obj1;
}

const MergeRecursiveArrayObjects = (array) => {
    let result = {};
    array.forEach((value, index, array)=>{
        MergeRecursive(result, value)
    })
    return result
}


let queryParseJson = ({ query, variables, tables }) => {
    let fields = [];

    let count = 0;
    let str = query.replace(/\n/g, '');
    str = str.replace(/__typename/g, '');

    let queryName = '';
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '(') {
            i++;
            count++;
            while (count !== 0) {
                if (str[i] === '(') {
                    count++;
                }
                if (str[i] === ')') {
                    count--;
                    if (count === 0) {
                        str = str.slice(i, str.length)
                        break;
                    }
                }
                i++;
            }
            break;
        } else if (str[i] === '{') {
            break;
        } else {
            queryName += str[i];
        }
    }
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '{') {
            str = str.slice(i, str.length)
            break;
        }
    }

    str = str.slice(1, query.length - 1);
    let pharse = (str) => {
        let count = 0;

        str = str.slice(1, str.length - 1);
        let requestJSON = {};
        let fields = [];
        let WHERE = '';
        let keyString = '';
        let valueString = '';

        for (let i = 0; i < str.length; i++) {
            if (str[i] === ' ') {
                if (keyString !== '' && str[i + 1] !== '{' && str[i + 1] !== ' ') {
                    fields.push(keyString);
                    keyString = '';
                }
            } else if (str[i] === '{') {
                valueString += '{';
                i++;
                count++;
                while (count !== 0) {
                    if (str[i] === '{') {
                        count++;
                    }
                    if (str[i] === '}') {
                        count--;
                        if (count === 0) {
                            requestJSON[keyString] = pharse(valueString);
                            fields.push(requestJSON);
                            requestJSON = {};
                            keyString = '';
                            valueString = '';
                        }
                    }
                    if (count !== 0) {
                        i++;
                        valueString += str[i];
                    }
                }
            } else {
                if (str[i] === '(') {
                    keyString += '$$$'
                    i++;
                    count++;
                    while (count !== 0) {
                        if (str[i] === '(') {
                            count++;
                        }
                        if (str[i] === ')') {
                            count--;
                        }
                        if (count !== 0) {
                            keyString += str[i]
                            i++;
                        }
                    }
                } else {
                    keyString += str[i]
                }
            }
        }

        return { fields, WHERE };
        //return fields;
    };
    let queryParse = ({ fields, variables, subscriptionName }) => {
        let subQuery = 0;

        let responseJson = {};


        let parse = (queryJson, queryStringFrom, localWhere) => {

            subQuery++;
            let key = Object.keys(queryJson)[0];

            let queryStringFields = '';
            let WHERE = '';
            let ORDER_BY = '';

            for (let i = 0; i < queryJson[key].fields.length; i++) {
                if (i !== 0 && i !== queryJson[key].fields.length) { queryStringFields += ', ' }

                if (typeof queryJson[key].fields[i] == "string") {
                    queryStringFields += queryJson[key].fields[i];
                } else {
                    let query = tables[queryStringFrom] ?
                        tables[queryStringFrom].fields[Object.keys(queryJson[key].fields[i])[0]] :
                        tables[Object.keys(tables).filter((tableKey) => { return tables[tableKey].comment === queryStringFrom})[0]].fields[Object.keys(queryJson[key].fields[i])[0]]

                    if (localWhere != null && tables[queryStringFrom]) {
                        if (Object.keys(queryJson[key].fields[i])[0] === Object.keys(localWhere)[0]) {
                            if (Object.keys(localWhere[Object.keys(queryJson[key].fields[i])[0]]).filter((item)=>{
                                return item === 'ORDER_BY'
                            }).length !== 0) {
                                ORDER_BY += 'ORDER BY ';
                                localWhere[Object.keys(queryJson[key].fields[i])[0]]['ORDER_BY'].map((item, index)=>{
                                    ORDER_BY += `${index === 0 ? '' : ','} ${item}`;
                                });
                                delete localWhere[Object.keys(queryJson[key].fields[i])[0]]['ORDER_BY'];
                            }
                            //console.log(Object.keys(queryJson[key].fields[i])[0], localWhere[Object.keys(queryJson[key].fields[i])[0]]);
                            if (Object.keys(localWhere[Object.keys(queryJson[key].fields[i])[0]]).length !== 0) {
                                WHERE = `AND ${parseWhere(localWhere[Object.keys(queryJson[key].fields[i])[0]], Object.keys(queryJson[key].fields[i])[0])}`;
                            }
                        }
                    }
                    queryStringFields += query
                        .replace('$*$', parse(queryJson[key].fields[i], Object.keys(queryJson[key].fields[i])[0], localWhere))
                        .replace('$WHERE$', WHERE ? WHERE : '')
                        .replace('$ORDER_BY$', ORDER_BY ? ORDER_BY : '')
                        .replace('$Q$', `Q${subQuery - 1}`)
                        .replace('$Q++$', `Q${subQuery}`);
                }
            }
            subQuery--;

            //if (Object.keys(variables).length != 0) {
            //    Object.keys(variables.WHERE).map((arg) => {
            //        if (Array.from(variables.WHERE[arg].matchAll(/UNION/g)).length != 0) {
            //            throw 'UNION';
            //        }
            //        if (Array.from(variables.WHERE[arg].matchAll(/;/g)).length != 0) {
            //            throw ';';
            //        }
            //        if (WHERE == '') {
            //            WHERE += `WHERE ${arg} ${variables.WHERE[arg]}`
            //        } else {
            //            WHERE += ` AND ${arg} ${variables.WHERE[arg]}`
            //        }
            //    })
            //}
            if (variables[queryStringFrom] && subQuery === 0) {
                WHERE = '';
                ORDER_BY = '';
                if (variables[queryStringFrom].global) {
                    if (Object.keys(variables[queryStringFrom].global).filter((item) => { return item === 'ORDER_BY' }).length !== 0) {
                        variables[queryStringFrom].global['ORDER_BY'].forEach((value, index) => {
                            ORDER_BY += `${index === 0 ? '' : ','} ${value}`;
                        });
                        delete variables[queryStringFrom].global['ORDER_BY'];
                    }
                    if (Object.keys(variables[queryStringFrom].global).length !== 0) {
                        WHERE = parseWhere(variables[queryStringFrom].global, queryStringFrom);
                    }
                }
            }
            return `${(subQuery === 0) ? 'SELECT ' : ''}${queryStringFields} ${(subQuery === 0) ? `FROM ${queryStringFrom} AS Q0` : ''}${(WHERE !== '' && subQuery === 0) ? ` WHERE ${WHERE}` : ''}${(ORDER_BY !== '' && subQuery === 0) ? ` ORDER BY ${ORDER_BY}` : ''}`;
        }

        fields.map((value, index, array) => {

            let from = Object.keys(fields[index])[0].slice(0, Object.keys(fields[index])[0].length);
            responseJson[Object.keys(fields[index])[0]] = parse(value, from, variables[from] ? variables[from].local : null);

            subQuery = 0;
        });

        return [responseJson, subscriptionName];
    }
    let parseWhere = (where, queryStringFrom) => {
        let queryStringWhere = '';
        if (Array.isArray(where)) {
            where.forEach((value, index, array)=>{
                if (index !== 0 && index !== array.length) { queryStringWhere += ' OR ' }
                queryStringWhere += `(${parseWhere(value, queryStringFrom)}}))`;
            });
        } else {
            Object.keys(where).forEach((key, i, array) => {
                if (i !== 0 && i !== array.length) { queryStringWhere += ' AND ' }
                if (typeof where[key] == 'string') {
                    queryStringWhere += tables[queryStringFrom].where[key].replace('$*$', `${where[key]}`);
                } else {
                    //subQuery++;
                    let WHERE = tables[queryStringFrom] ?
                        tables[queryStringFrom].where[key] :
                        tables[Object.keys(tables).filter((tableKey) => { return tables[tableKey].comment === queryStringFrom})[0]].where[Object.keys(where[key])[0]]
                    let FROM = tables[key] ?
                        key :
                        Object.keys(tables).filter((tableKey) => { return tables[tableKey].comment === key })[0]

                    queryStringWhere += WHERE.replace('$WHERE$', parseWhere(where[key], FROM));

                }
            });
        }

        return queryStringWhere;
    }

    let keyString = '';
    let valueString = '';
    for (let i = 0; i < str.length; i++) {
        if (str[i] === ' ') {
        } else
        if (str[i] === '(') {
            i++;
            count++;
            while (count !== 0) {
                if (str[i] === '(') {
                    count++;
                }
                if (str[i] === ')') {
                    count--;
                    if (count === 0) {
                        WHERE = valueString;
                        valueString = '';
                    }
                }
                if (count !== 0) {
                    valueString += str[i];
                    i++;
                }
            }
            count = 0;
        } else if (str[i] === '{') {
            valueString += '{';
            i++;
            count++;
            while (count !== 0) {
                if (str[i] === '{') {
                    count++;
                }
                if (str[i] === '}') {
                    count--;
                    if (count === 0) {
                        let tempJson = {};
                        tempJson[keyString] = pharse(valueString);
                        fields.push(tempJson);
                        keyString = '';
                        valueString = '';
                    }
                }
                if (count !== 0) {
                    valueString += str[i];
                    i++;
                }
            }
        } else {
            keyString += str[i];
        }
    }
    let ttt = queryParse({ fields, variables, subscriptionName: queryName.split(' ')[1]});
    //console.log(ttt);
    return ttt;
}

let now = (timestamp = new Date)=> {
    return `${(new Date(timestamp - (timestamp).getTimezoneOffset() * 60000)).toISOString().slice(0, -5).replace(/T/, ' ')}`
}


const color = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    
    fg: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        crimson: "\x1b[38m" // Scarlet
    },
    bg: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
        crimson: "\x1b[48m"
    }
};

const skudLogger = (file,message,fs) => {   //The file is created if not existing!!
let logDate=new Date();
fs.writeFile(file, logDate.toLocaleDateString()+" "+logDate.getHours()+":"+logDate.getMinutes()+":"+logDate.getMilliseconds()
+' -> '+message+'\n', { flag: "a+" }, (err) => {
  if (err) throw err;  
});
}

module.exports = {
    MergeRecursive,
    MergeRecursiveArrayObjects,
    queryParseJson,
    now,
	color,
	skudLogger
}