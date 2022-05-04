import { DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { gql, useMutation } from '@apollo/client';
import { Button, Form, Input, Popconfirm } from 'antd';
import React, { useEffect, useState } from 'react';
import { handlerQuery, handlerMutation, useUser } from '../../../core/functions';
import ModalInsert from '../../../core/modal/ModalInsert';
import ModalUpdate from '../../../core/modal/ModalUpdate';
import TableContainer from '../../../core/TableContainer';
import TitleMenu from '../../../core/TitleMenu';
import test from "../../../core/functions/test";

let document_statuses = {
    exemplar: 'document_statuses',
    table: 'document_statuses',
    options: {
        all: {
			 /*variables: {
                controller_addresses: { global: {ORDER_BY: ['id DESC']}}
            },*/
            fetchPolicy: 'cache-only'
        },
        one: {
            fetchPolicy: 'standby'
        }
    },
    select: {
        all: gql`
            query document_statuses ($document_statuses: JSON) {
                document_statuses (document_statuses: $document_statuses) {
                    id
                    name
                }
            }
        `,
        one: gql`
            query document_statuses($document_statuses: JSON) {
                document_statuses(document_statuses: $document_statuses) {
                    id
                    name
                }
            }
        `
    },
    subscription: {
        all: gql`
            subscription document_statuses ($document_statuses: JSON){
                document_statuses (document_statuses: $document_statuses) {
                    id
                    name
                }
            }
        `
    },
    insert: gql`
        mutation insertDocumentStatus($document_statuses: JSON) {
            insertDocumentStatus(document_statuses: $document_statuses){
                message
            }
        }
    `,
    update: gql`
        mutation updateDocumentStatus($document_statuses: JSON) {
            updateDocumentStatus(document_statuses: $document_statuses){
                message
            }
        }
    `,
	delete: gql`
        mutation deleteDocumentStatus($document_statuses: JSON) {
            deleteDocumentStatus(document_statuses: $document_statuses){
                message
            }
        }
    `
}


let DocumentStatusesPage = React.memo((props) => {
	let user = useUser();
    const visibleModalUpdate = useState(false);
	
    const [remove, { loading: loadingRemove }] = handlerMutation(useMutation(document_statuses.delete))();

    const { loading, data, refetch } = handlerQuery(document_statuses, 'all')();
    useEffect(() => { refetch() }, []);
    let list = (data && data[Object.keys(data)[0]] != null) ? data[Object.keys(data)[0]].map((item) => {
        return {
            id: item.id,
            key: item.id,
            name: item.name
        }
    }) : [];
    let dict = test([
        { title: 'ID', dataIndex: 'id', width: '114px', type:'search', tooltip: true },
        { title: 'Название', dataIndex: 'name', width: '95px', type:'search', tooltip: true }
    ]);
    let titleMenu = (tableProps) => {
        return (<TitleMenu
            title='Редактирование статусов документов'
            buttons={[
                <ModalInsert title='Добавление статуса' GQL={document_statuses} InsertForm={DocumentStatusesForm} />,
                <ModalUpdate visibleModalUpdate={visibleModalUpdate} title='Редактирование статуса' selectedRowKeys={tableProps.selectedRowKeys} GQL={document_statuses} UpdateForm={DocumentStatusesForm} update={true} />,
				<Popconfirm
                    title="Вы уверены?"
                    onConfirm={() => { let variables = {}; variables[document_statuses.exemplar] = { id: Number(tableProps.selectedRowKeys[0]), log_username: user.username }; remove({ variables }) }}
                    okText="Да"
                    cancelText="Нет"
                    icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    disabled={tableProps.selectedRowKeys.length !== 1}
                >
                    <Button key="remove" type="dashed" danger loading={loadingRemove} disabled={tableProps.selectedRowKeys.length !== 1}><DeleteOutlined />Удалить</Button>
                </Popconfirm>
            ]}
            selectedRowKeys={tableProps.selectedRowKeys}
        />)
    };

    return (
        <TableContainer
            data={{ dict, records: list }}
            loading={loading}
            title={titleMenu}
            visibleModalUpdate={visibleModalUpdate}
        />
    )
});

let DocumentStatusesForm = React.memo((props) => {
	let user = useUser();
  const [state, setState] = useState({
		isuseforreport:false,
		log_username:user.username
    });

    useEffect(() => { props.form.setFieldsValue(state) }, [state]);

    useEffect(() => {
        if (props.initialValues) {
            setState({
                id: props.initialValues.document_statuses[0].id,
                name: props.initialValues.document_statuses[0].name,
			    log_username:state.log_username
			});
		}
    }, [props.initialValues]);
	
	let onFinish = (values) => {
        props.onFinish(state)
    }
    return (
        <Form
            form={props.form}
            name="DocumentStatusesForm"
            onFinish={onFinish}
            scrollToFirstError
            autoComplete="off"

            onValuesChange={(changedValues, allValues) => { setState(Object.assign({}, state, { ...allValues, })) }}
            
        >
            <Form.Item
                name="name"
                rules={[
                    {
                        required: true,
                        message: 'Необходимо для заполнения!',
                        whitespace: true,
                    },
                ]}
            >
                <Input disabled={props.disabled} placeholder="Название статуса документа" />
            </Form.Item>
			<Form.Item
                name="log_username"
				hidden={true}
            >
                <Input disabled={props.disabled}/>
            </Form.Item>
        </Form>
    )
});

export default DocumentStatusesPage;