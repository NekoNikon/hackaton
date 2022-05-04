import { Table } from 'antd';
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import {handlerQuery, handlerMutation, useUser} from '../../../core/functions'


let TableContainer = React.memo(({ GQL,...props}) => {
    let [selectedRowKeys, setSelectedRowKeys] = useState([]);
    let itemKeys = [];
    if (!props.loading) {
        itemKeys = props.data.records.map((item) => {
            return item.id
        });
    }
    const [readTrue,  loading ] = handlerMutation(useMutation(GQL.setIsReadTrue))();
    let documentId={id:selectedRowKeys[0]}
    let variables= {}
    variables[GQL.exemplar] = documentId
    variables.document.is_read = true
    useEffect(() => {
        setSelectedRowKeys(selectedRowKeys.filter((item) => {
            for (var i = 0; i < itemKeys.length; i++) {
                if (itemKeys[i] == item) {
                    return true;
                }
            }
            return false;
        }));
    }, [props.data]);

    return (
        <>
            <Table
                className='sd-tables-row-hover'
                loading={props.loading}
                style={{ minHeight: 168 }}
                // bordered={true}
                columns={props.data.dict}
                dataSource={props.data.records}
                scroll={{ y: 'calc(100vh - 231px)', minX: 500 }}
                size='small'
                title={props.title ? () => (props.title({ selectedRowKeys: selectedRowKeys })) : null}
                bordered={props.bordered}
                onRow={(record, rowIndex) => {
                    return {
                        onClick: event => { 
                            setSelectedRowKeys([record.key, record.route_id])
                        },
                        onDoubleClick: event => {
                            console.log('record',record)
                            if(record.is_read == false){
                                readTrue({variables})
                                props.visibleModalUpdate[1](true)
                                console.log('false')
                            }else{
                                console.log('true')
                                props.visibleModalUpdate[1](true)
                            }
                        }
                    }
                }}
                pagination={{
                    // simple: true,
                    pageSize: 50,
                    //defaultCurrent=6, - to check both commented
                    //total={props.data.records.length},
                    showSizeChanger: false
                }}
                rowClassName={(record, index) => {
                    let className = ''
                    if (record.is_read == false){
                        className += 'is_read_false'
                    }
                    if (record.key === selectedRowKeys[0]) {
                        return 'ant-table-row ant-table-row-level-0 statusSelected';
                    }
                    return 'ant-table-row ant-table-row-level-0', className;
                }}
            />
        </>
    );
});

export default TableContainer

