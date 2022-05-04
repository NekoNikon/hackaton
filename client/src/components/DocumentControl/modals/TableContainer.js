
import { Table } from 'antd';
import React, { useState, useEffect } from 'react';



let TableContainer = React.memo((props) => {
    let [selectedRowKeys, setSelectedRowKeys] = useState([]);

    let itemKeys = [];

    if (!props.loading) {
        itemKeys = props.data.records.map((item) => {
            return item.id
        });
    }

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

    //console.log('props TableContainer', props)

    return (
        <>
            <Table
                className='sd-tables-row-hover'
                loading={props.loading}
                style={{minHeight: 168}}
                // bordered={true}
                columns={props.data.dict}
                dataSource={props.data.records}
                scroll={{ y: 'calc(100vh - 231px)', minX: 500 }}
                size='small'
                title={props.title ? () => (props.title({ selectedRowKeys: selectedRowKeys })) : null}
                bordered={props.bordered}
                onRow={(record, rowIndex) => {
                    return {
                        onClick: event => { setSelectedRowKeys([record.key,record.route_id]) },
                        onDoubleClick: event => { props.visibleModalUpdate[1](true) }
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
