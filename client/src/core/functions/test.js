import getColumnSearchTextProps from "./getColumnSearchTextProps";
import React from "react";
import {Tooltip} from "antd";

let withoutWordWrap = (minWidth = 10) =>{
    return text =>
        <div style={{ whiteSpace:'pre',overflow: 'hidden', minWidth: minWidth -16, textOverflow: 'ellipsis'}}>{text}</div>
}
let withoutWordWrapWithTooltip = (minWidth = 10) =>{
    return text =>
        <Tooltip title={text} color={'grey'}>
            <div style={{ whiteSpace:'pre',overflow: 'hidden', minWidth: minWidth -16, textOverflow: 'ellipsis'}}>{text}</div>
        </Tooltip>
}


let test1 = ({title, dataIndex,  width,  render = (text) => {return text}, filters, onFilter,type, tooltip, children, ...object }) => {
    if (children) {
        return {title, dataIndex,  width,  render, filters, onFilter,type, tooltip, children, ...object };
    }
    let textRender = withoutWordWrap;
    if (tooltip) {
        textRender = withoutWordWrapWithTooltip;
    }

    const getProps = (type) => {
        switch (type) {
            case 'search':
                return getColumnSearchTextProps(dataIndex, title, (text, record)=>{ return textRender(width)(render(text, record))})
            case 'filter':
                return {

                }
            default:
                return {
                    render : (text, record)=>{return textRender(width)(render(text, record))}
                }
        }
    }
    return {
        title: withoutWordWrap(width)(title),
        dataIndex,
        width,
        filters,
        onFilter,
        ...object,
        ...getProps(type)
    }
}

const test = (columns) => {

    return columns.map((object)=>{
        return test1(object)
    })
};

export default test;