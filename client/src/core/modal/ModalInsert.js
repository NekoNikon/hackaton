import { PlusCircleOutlined } from '@ant-design/icons';
import { useMutation } from '@apollo/client';
import { Button, Form, Modal } from 'antd';
import React, { useState } from 'react';
import { handlerMutation } from '../functions';



let ModalInsert = React.memo(({ GQL, InsertForm, ...props }) => {
    const [form] = Form.useForm();
    const [visible, setVisible] = useState(false);

    const [insert, { loading }] = handlerMutation(useMutation(GQL.insert), () => { setVisible(false); form.resetFields() })();

    return (
        <>
            <Button
                type="primary"
                onClick={() => { setVisible(true) }}
            >
                <PlusCircleOutlined />Добавить
            </Button>
            <Modal
                title={props.title}
                visible={visible}
                onOk={() => { form.submit() }}
                onCancel={() => { setVisible(false) }}
                cancelText='Отмена'
                okText='Сохранить'

                centered
                width={props.width?props.width:450}

                maskClosable={false}
                destroyOnClose={true}
                confirmLoading={loading ? loading : false}
            >
                <InsertForm
                    form={form}
                    onFinish={(values) => { let variables = {}; variables[GQL.exemplar] = values; insert({ variables }) }}
                />
            </Modal>
        </>
    );
});



export default ModalInsert;