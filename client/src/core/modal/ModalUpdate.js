import { EyeOutlined } from '@ant-design/icons';
import { useMutation } from '@apollo/client';
import { Button, Form, Modal, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { handlerQuery } from '../../core/functions';
import { handlerMutation } from '../functions';

let ModalUpdate = React.memo(({ GQL, UpdateForm, ...props }) => {
    const [form] = Form.useForm();
    const [visible, setVisible] = props.visibleModalUpdate;
    const [viewMode, setViewMode] = useState(true);

    let variables = {}; variables[GQL.table] = { global: { id: `= ${props.selectedRowKeys[0]}` } };
    const { loading: loadingOne, data, refetch } = handlerQuery(GQL, 'one', { variables })();

    useEffect(() => { if (data) { form.resetFields() } }, [data]);
    useEffect(() => { if (visible) { refetch() } }, [visible]);
    window.setVisible = setVisible;

    const [update, { loading: loadingUpdate }] = handlerMutation(useMutation(GQL.update), () => { setVisible(false); setViewMode(true) })();

    return (
        <>
            <Button
                type="primary"
                disabled={props.selectedRowKeys.length !== 1}
                onClick={() => { setVisible(true) }}
            >
                <EyeOutlined />Просмотр
            </Button>
            <Modal
                title={props.title}
                visible={visible}

                centered
                width={props.width?props.width:450}
                onOk={() => { form.submit() }}
                onCancel={() => { setVisible(false); setViewMode(true) }}

                maskClosable={false}
                destroyOnClose={true}
                footer={[
                    <Button key="cancel" onClick={() => { setVisible(false); setViewMode(true) }}>Отмена</Button>,
                    viewMode ?
                        props.update && <Button key="setViewMode" type="primary" onClick={() => { setViewMode(false) }}>Редактировать</Button> :
                        <Button key="update" type="primary" loading={loadingUpdate} onClick={() => { form.submit() }}>Сохранить</Button>
                    
                ]}
            >
                <Spin spinning={loadingOne}><UpdateForm
                    form={form}
                    onFinish={(values) => { let variables = {}; variables[GQL.exemplar] = values; update({ variables }) }}
                    initialValues={data}
                    disabled={viewMode}
                /></Spin>
            </Modal>
        </>
    );
});

export default ModalUpdate;

 //?data[`${GQL.table}TEST`][0] : data