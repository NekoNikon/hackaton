import { DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { gql, useMutation } from '@apollo/client';
import { Button, Form, Input, Popconfirm, Tree } from 'antd';
import React, { useEffect, useState } from 'react';
import { handlerQuery, handlerMutation, useUser } from '../../../core/functions';
import ModalInsert from '../../../core/modal/ModalInsert';
import ModalUpdate from '../../../core/modal/ModalUpdate';
import TableContainer from '../../../core/TableContainer';
import TitleMenu from '../../../core/TitleMenu';
import test from "../../../core/functions/test";

let positions = {
    exemplar: 'positions',
    table: 'positions',
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
            query positions ($positions: JSON) {
                positions (positions: $positions) {
                    id
                    name
                    accesses
                }
            }
        `,
        one: gql`
            query positions($positions: JSON) {
                positions(positions: $positions) {
                    id
                    name
                    accesses
                }
            }
        `
    },
    subscription: {
        all: gql`
            subscription positions ($positions: JSON){
                positions (positions: $positions) {
                    id
                    name
                    accesses
                }
            }
        `
    },
    insert: gql`
        mutation insertPosition($positions: JSON) {
            insertPosition(positions: $positions){
                message
            }
        }
    `,
    update: gql`
        mutation updatePosition($positions: JSON) {
            updatePosition(positions: $positions){
                message
            }
        }
    `,
	delete: gql`
        mutation deletePosition($positions: JSON) {
            deletePosition(positions: $positions){
                message
            }
        }
    `
}


let DocumentPositionsPage = React.memo((props) => {
	let user = useUser();
    const visibleModalUpdate = useState(false);
	
    const [remove, { loading: loadingRemove }] = handlerMutation(useMutation(positions.delete))();

    const { loading, data, refetch } = handlerQuery(positions, 'all')();
    useEffect(() => { refetch() }, []);
    let list = (data && data[Object.keys(data)[0]] != null) ? data[Object.keys(data)[0]].map((item) => {
        return {
            id: item.id,
            key: item.id,
            name: item.name,
            accesses: item.accesses,
        }
    }) : [];
    let dict = test([
        { title: 'ID', dataIndex: 'id', width: '114px', type:'search', tooltip: true },
        { title: '????????????????', dataIndex: 'name', width: '95px', type:'search', tooltip: true }
    ]);
    let titleMenu = (tableProps) => {
        return (<TitleMenu
            title='???????????????????????????? ????????????????????'
            buttons={[
                <ModalInsert title='???????????????????? ??????????????????' GQL={positions} InsertForm={DocumentPositionsForm} />,
                <ModalUpdate visibleModalUpdate={visibleModalUpdate} title='???????????????????????????? ??????????????????' selectedRowKeys={tableProps.selectedRowKeys} GQL={positions} UpdateForm={DocumentPositionsForm} update={true} />,
				<Popconfirm
                    title="???? ???????????????"
                    onConfirm={() => { let variables = {}; variables[positions.exemplar] = { id: Number(tableProps.selectedRowKeys[0]), log_username: user.username }; remove({ variables }) }}
                    okText="????"
                    cancelText="??????"
                    icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    disabled={tableProps.selectedRowKeys.length !== 1}
                >
                    <Button key="remove" type="dashed" danger loading={loadingRemove} disabled={tableProps.selectedRowKeys.length !== 1}><DeleteOutlined />??????????????</Button>
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

let DocumentPositionsForm = React.memo((props) => {
	let user = useUser();
  const [state, setState] = useState({
		log_username:user.username
    });

    useEffect(() => { props.form.setFieldsValue(state) }, [state]);

    useEffect(() => {
        if (props.initialValues) {
            setState({
                id: props.initialValues.positions[0].id,
                name: props.initialValues.positions[0].name,
                accesses: props.initialValues.positions[0].accesses,
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
            name="DocumentPositionsForm"
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
                        message: '???????????????????? ?????? ????????????????????!',
                        whitespace: true,
                    },
                ]}
            >
                <Input disabled={props.disabled} placeholder="???????????????? ??????????????????" />
            </Form.Item>
            <h3>???????????????????? ??????????????:</h3>
            <Form.Item
                name='accesses'
                rules={[
                    {
                        type: 'array',
                        required: true,
                        message: '???????????????????? ?????? ????????????????????!'
                    },
                ]}
            >
                <PositionsPermissionsTree disabled={props.disabled} />
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

let PositionsPermissionsTree = React.memo((props) => {

    const [autoExpandParent, setAutoExpandParent] = useState(true);
    const [expandedKeys, setExpandedKeys] = useState([]);

    const treeData = [
        {
            title: "????????????????",
            key: "/document-control-p",
            children: [
                {
                    title: "????????????????",
                    key: "/document-control-p/select"
                },
                {
                    title: "????????????????????",
                    key: "/document-control-p/insert"
                },
                {
                    title: "??????????????????",
                    key: "/document-control-p/update"
                },
                {
                    title: "????????????????",
                    key: "/document-control-p/delete"
                },
                {
                    title: "?????????????????? ?????????????? ??????????????????",
                    key: "/document-control-p/document-status-change"
                },
                {
                    title: "?????????????????? ?????????????? ??????????????????",
                    key: "/document-control-p/item-status-change"
                },
            ]
        },
        {
            title: "????????????",
            key: "/document-report-p",
            children: [
                {
                    title: "????????????????",
                    key: "/document-report-p/select"
                },
                {
                    title: "????????????????????",
                    key: "/document-report-p/insert"
                },
                {
                    title: "??????????????????",
                    key: "/document-report-p/update"
                },
                {
                    title: "????????????????",
                    key: "/document-report-p/delete"
                },
                {
                    title: "?????????????????? ?????????????? ??????????????????",
                    key: "/document-report-p/document-status-change"
                },
                {
                    title: "?????????????????? ?????????????? ??????????????????",
                    key: "/document-report-p/item-status-change"
                },
            ]
        },
        {
            title: "??????????????",
            key: "/document-hitory-p",
            children: [
                {
                    title: "????????????????",
                    key: "/document-hitory-p/select"
                },
                {
                    title: "????????????????????",
                    key: "/document-hitory-p/insert"
                },
                {
                    title: "??????????????????",
                    key: "/document-hitory-p/update"
                },
                {
                    title: "????????????????",
                    key: "/document-hitory-p/delete"
                },
                {
                    title: "?????????????????? ?????????????? ??????????????????",
                    key: "/document-hitory-p/document-status-change"
                },
                {
                    title: "?????????????????? ?????????????? ??????????????????",
                    key: "/document-hitory-p/item-status-change"
                },

            ]
        },
        {
            title: "??????????",
            key: "/document-search-p",
            children: [
                {
                    title: "????????????????",
                    key: "/document-search-p/select"
                },
                {
                    title: "????????????????????",
                    key: "/document-search-p/insert"
                },
                {
                    title: "??????????????????",
                    key: "/document-search-p/update"
                },
                {
                    title: "????????????????",
                    key: "/document-search-p/delete"
                },
                {
                    title: "?????????????????? ?????????????? ??????????????????",
                    key: "/document-search-p/document-status-change"
                },
                {
                    title: "?????????????????? ?????????????? ??????????????????",
                    key: "/document-search-p/item-status-change"
                },
            ]
        },
        {
            title: "??????????????????????????",
            key: "/admin-p",
            children: [
                {
                    title: "????????????????",
                    key: "/admin-p/select"
                },
                {
                    title: "????????????????????",
                    key: "/admin-p/insert"
                },
                {
                    title: "??????????????????",
                    key: "/admin-p/update"
                },
                {
                    title: "????????????????",
                    key: "/admin-p/delete"
                },
                {
                    title: "?????????????????? ?????????????? ??????????????????",
                    key: "/admin-p/document-status-change"
                },
                {
                    title: "?????????????????? ?????????????? ??????????????????",
                    key: "/admin-p/item-status-change"
                },
            ]
        }
    ];


    return (
        <Tree
            checkable
            onExpand={(expandedKeys) => {
                setExpandedKeys(expandedKeys);
                setAutoExpandParent(false);
            }}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
            onCheck={(values) => { props.onChange(values) }}
            checkedKeys={props.value}
            treeData={treeData}
            disabled={props.disabled}
        />
    );
});

export default DocumentPositionsPage;