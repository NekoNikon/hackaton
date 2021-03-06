import { DeleteOutlined, QuestionCircleOutlined, FileImageOutlined } from '@ant-design/icons';
import { gql, useMutation, useQuery, useSubscription } from '@apollo/client';
import { Button, Form, Input, Popconfirm, Typography, Space, Divider, Row, Col } from 'antd';
import React, { useEffect, useState } from 'react';
import { handlerQuery, handlerMutation, useUser, notifyMe, formatDate } from '../../../core/functions';
import ModalUpdate from '../modals/ModalUpdate';
import TableContainerIsRead from '../modals/TableContainerIsRead';
import TitleMenu from '../../../core/TitleMenu';
import test from "../../../core/functions/test";

const { Title, Link } = Typography;

let sendNotification = async () => {
    const tmp = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            { items: true }
        )
    })
    const content = await tmp.json();
}

let OnApprovalDocuments = React.memo((props) => {
    let user = useUser();
    let positionsVariable = user.positions.toString();
    console.log('positionsVariable', positionsVariable)

    let documents = {
        exemplar: 'document',
        table: 'documents',
        options: {
            all: {
                variables: { documents: { global: { positions: positionsVariable, ORDER_BY: ['date_created desc'] } } },
                fetchPolicy: 'cache-only'
            },
            one: {
                fetchPolicy: 'standby'
            }
        },
        select: {
            all: gql`
        query documents ($documents: JSON) {
            documents(documents:$documents) {
                id
                title
                user_id
                username
                position
                fio
                description
                prise
                supllier
                subject
                date_created
                date_modified
                status_id
                document_statuses{
                    id
                    name
                }
                route_id{
                    id
                    name
                    routes
                    status_in_process
                    status_cancelled
                    status_finished
                }
                step
                is_read
            }
        }`,
            one: gql`
            query documents ($documents: JSON) {
                documents(documents:$documents) {
                    id
                    title
                    user_id
                    username
                    position
                    fio
                    description
                    prise
                    supllier
                    subject
                    date_created
                    date_modified
                    status_id
                    is_read
                    document_statuses{
                        id
                        name
                    }
                    route_id{
                        id
                        name
                        routes
                        status_in_process
                        status_cancelled
                        status_finished
                    }
                    files{
                        id
                        filename
                    }
                    signatures{
                        id
                        document_id
                        user_id
                        username
                        date_signature
                        position
                        fio
                    }
                    step
                }
            }
        `
        },
        subscription: {
            all: [gql`
        subscription documents ($documents: JSON){
            documents(documents: $documents){
                id
                title
                date_created
                date_modified
                status_id
                is_read
                document_statuses{
                        id
                        name
                    }
                route_id{
                    id
                    name
                    routes
                    status_in_process
                    status_cancelled
                    status_finished
                }
                step
            }
        }`
            ]
        },
        insert: gql`
       mutation insertDocument($document: JSON) {
        insertDocument(document: $document) {
            type
            message
        }
    }
    `,
        update: gql`
        mutation updateDocument($document: JSON) {
        updateDocument(document: $document) {
            type
            message
        }
    }
    `,
        delete: gql`
        mutation deleteDocument($document: JSON) {
        deleteDocument(document: $document) {
            type
            message
        }
    }
    `,
        setIsReadTrue: gql`
        mutation setIsReadTrue($document: JSON) {
        setIsReadTrue(document: $document) {
            type
            message
        }
    }
    `
    };

    //subscriptions
    const { data: dataSub, loading: loadingSub } = useSubscription(
        documents.subscription.all[0],
        { variables: { documents: { global: { step: '>0', ORDER_BY: ['date_created desc'] } } } }
    );
    useEffect(() => {
        if (!loadingSub && dataSub && dataSub[Object.keys(dataSub)[0]] != null) {
            console.log('notification', dataSub)
            sendNotification();
            notifyMe('???????? ?????????? ???????????????? ??????????????????');
        }
    }, [dataSub]);

    const visibleModalUpdate = useState(false);

    const [remove, { loading: loadingRemove }] = handlerMutation(useMutation(documents.delete))();

    const { loading, data, refetch } = handlerQuery(documents, 'all')();
    useEffect(() => { refetch() }, []);

    let list = (data && data[Object.keys(data)[0]] != null) ? data[Object.keys(data)[0]].map((item) => {
        return {
            id: item.id,
            key: item.id,
            title: item.title,
            user_info: item.fio + ' ' + item.position,
            date_created: item.date_created,
            date_modified: item.date_modified,
            status_id: item.status_id,
            status: item.document_statuses?.name ? item.document_statuses.name : '?????? ??????????????',
            route_id: item.route_id.id,
            route: item.route_id?.name ? item.route_id.name : '???? ??????????',
            route_data: item.route_id?.routes ? item.route_id.routes : [],
            route_step: item.route_id?.routes ? item.route_id.routes.findIndex(item => item.positionId == positionsVariable) + 1 : [],
            step:item.step,
            step_count: item.step + ' ???? ' + item.route_id.routes.length,
            //step_name:console.log('DDDDDD',item.step)
            step_name: item?.route_id?.routes?.length > 0 ? item.route_id.routes[item.step - 1].positionName : '',
            is_read: item.is_read
            //step_name: item.route_id?.routes ? item.route_id.routes[item.route_id.routes.findIndex(item => item.positionId == item.step)].positionName : ''
        }
    }) : [];

    console.log('list', list)
    console.log('data', data)
    //console.log('list2', list2)

    let listFiltered = list.filter((el) => {
        return el.step == el.route_step && el.status_id != 4
    });

    window.localStorage['rows_onaproval'] = listFiltered.length;

    //console.log('newArray', newArray)

    let dict = test([
        { title: '???????????????????????? ????????????????', dataIndex: 'title', width: '214px', type: 'search', tooltip: true, sorter: true },
        { title: '???? ????????', dataIndex: 'user_info', width: '114px', type: 'search', tooltip: true, sorter: true },
        { title: '???????? ?? ?????????? ????????????????', dataIndex: 'date_created', width: '114px', type: 'search', tooltip: true, sorter: true },
        { title: '?????????????????? ??????????????????', dataIndex: 'date_modified', width: '114px', type: 'search', tooltip: true, sorter: true },
        { title: '?????? ????????????????', dataIndex: 'route', width: '114px', type: 'search', tooltip: true, sorter: true },
        { title: '????????????', dataIndex: 'status', width: '80px', tooltip: true, sorter: true },
        { title: '???? ??????????????', dataIndex: 'step_name', width: '114px' },
        { title: '????????', dataIndex: 'step_count', width: '55px' },
        // { title: '?????? ??.', dataIndex: 'route_step', width: '55px' }
    ]);


    let titleMenu = (tableProps) => {
        return (<TitleMenu
            buttons={[
                <ModalUpdate visibleModalUpdate={visibleModalUpdate} title='???????????????????????????? ??????????????????' selectedRowKeys={tableProps.selectedRowKeys}
                    GQL={documents} UpdateForm={DocumentsFormUpdate} update={true} width={750} />,
                <Popconfirm
                    title="???? ???????????????"
                    onConfirm={() => { let variables = {}; variables[documents.exemplar] = { id: Number(tableProps.selectedRowKeys[0]), log_username: user.username }; remove({ variables }) }}
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
        <TableContainerIsRead
            data={{ dict, records: listFiltered }}
            loading={loading}
            title={titleMenu}
            visibleModalUpdate={visibleModalUpdate}
            GQL={documents}
        />
    )
});

const price_pattern= /^\d+$/;

let DocumentsFormUpdate = React.memo((props) => {
    let user = useUser();

    const [state, setState] = useState({
        log_username: user.username,
    });

    let OpenDocument = async (item) => {
        // setBtnLoad(true)
        console.log("PROPS", item.id)
        // console.log('RECORD',props.record)
        const tmp = await fetch('/api/files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                { item }
            )
        })
        const content = await tmp.json();
        if (content != undefined) {
            console.log("RESULT", content)
        }
    }

    useEffect(() => { props.form.setFieldsValue(state) }, [state]);

    useEffect(() => {
        if (props.initialValues) {
            setState({
                id: props.initialValues.documents[0].id,
                title: props.initialValues.documents[0].title,
                position: props.initialValues.documents[0].position,
                username: props.initialValues.documents[0].username,
                fio: props.initialValues.documents[0].fio,
                description: props.initialValues.documents[0].description,
                prise: props.initialValues.documents[0].prise,
                supllier: props.initialValues.documents[0].supllier,
                subject: props.initialValues.documents[0].subject,
                date_created: props.initialValues.documents[0].date_created,
                date_modified: props.initialValues.documents[0].date_modified,
                route_id: props.initialValues.documents[0].route_id.id,
                status_in_process: props.initialValues.documents[0].route_id.status_in_process,
                status_cancelled: props.initialValues.documents[0].route_id.status_cancelled,
                status_finished: props.initialValues.documents[0].route_id.status_finished,
                status_id: props.initialValues.documents[0].status_id,
                route: props.initialValues.documents[0].route_id.routes,
                step: props.initialValues.documents[0].step,
                comments: props.initialValues.documents[0].comments,
                signatures: props.initialValues.documents[0].signatures,
                files: props.initialValues.documents[0].files,
                is_read: props.initialValues.documents[0].is_read,
                log_username: state.log_username
            });
            console.log('props.initialValues', props.initialValues)
        }
    }, [props.initialValues]);

    let download = async (e) => {
        let id = e.target.dataset.fileid
        await fetch("/get-file", {
            method: "POST",
            body: JSON.stringify({ id: e.target.dataset.fileid }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            return response.json()
        }).then(response => {
            let result = response.result
            let link = document.createElement('a')
            link.href = result.data_file /*result.data_file.slice(result.data_file.indexOf(',')+1) */
            link.download = result.filename
            link.click()
        })
    }

    let onFinish = (values) => {
        props.onFinish(state);
        console.log('+++++++++++++++++++++++', values);
    }

    return (
        <Form
            form={props.form}
            name="DocumentsForm"
            onFinish={onFinish}
            scrollToFirstError
            autoComplete="off"

            onValuesChange={(changedValues, allValues) => { setState(Object.assign({}, state, { ...allValues, })) }}

        >
            <b>????:</b> {props?.initialValues?.documents[0].fio} <br/>
            <b>??????????????????:</b> {props?.initialValues?.documents[0].position}

            <Divider type={'horizontal'} />

            <Form.Item
                name="title"
                label='???????????????????????? ??????'
                labelCol={{ span: 24 }}
                rules={[
                    {
                        required: true,
                        message: '???????????????????? ?????? ????????????????????!',
                        whitespace: true,
                    },
                ]}
            >
                <Input disabled={props.disabled} placeholder="???????????????????????? ??????" />
            </Form.Item>
            <Form.Item
                name="supllier"
                label='?????????????????? ??????'
                labelCol={{ span: 24 }}
                rules={[
                    {
                        required: true,
                        message: '???????????????????? ?????? ????????????????????!',
                        whitespace: true,
                    },
                ]}
            >
                <Input disabled={props.disabled} placeholder="?????????????????? ??????" />
            </Form.Item>
            <Form.Item
                name="subject"
                label='"??????????????????'
                labelCol={{ span: 24 }}
                rules={[
                    {
                        required: true,
                        message: '???????????????????? ?????? ????????????????????!',
                        whitespace: true,
                    },
                ]}
            >
                <Input disabled={props.disabled} placeholder="??????????????????" />
            </Form.Item>
            <Form.Item
                name="prise"
                label='"?????????? ?????????? ????????????????'
                labelCol={{ span: 24 }}
                rules={[
                    {
                        required: true,
                        message: '???????????????????? ?????? ????????????????????!',
                        whitespace: true,
                    },
                    {
                        pattern: price_pattern,
                        message: '?????????? ???????????????????????? ???????????? ??????????!',
                        whitespace: true,
                    },
                ]}
            >
                <Input disabled={props.disabled} placeholder="?????????? ?????????? ????????????????" />
            </Form.Item>
            <Divider type={'horizontal'} />
            <Form.Item
                name="files"
                className='font-form-header'
                label="??????????"
                labelCol={{ span: 24 }}
            >
                {props?.initialValues?.documents[0].files.map((item) => {
                    let blolbFile = new Blob([`${item.data_file}`], { type: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
                    return (<>
                        <div className='document-view-wrap'>
                            <Link><a data-fileid={item.id} onClick={download} >{item.filename} <FileImageOutlined /></a></Link> <br/>
                            {/* <Link><a href={`/uploads/${item.filename}`} data-fileid={item.id} onClick={download} >{item.filename} <FileImageOutlined /></a></Link> <br/> */}
                            <Button onClick={() => { OpenDocument(item) }}>????????????????</Button> <br />
                        </div>
                    </>)
                })}
            </Form.Item>
            <Divider type={'horizontal'} />
            <Form.Item
                className='font-form-header'
                name="signatures"
                label="??????????????"
                labelCol={{ span: 24 }}
            >
                {props?.initialValues?.documents[0].signatures.map((item) => {  //remove commentsList
                    return (<> 
                        <div className='signature-view-wrap'>
                            <span className='signature-view-position'>
                                {item.position}
                            </span>
                            <span className='signature-view-username'>
                                {item.fio}
                            </span>
                            <span className='signature-view-date'>
                                {formatDate(item.date_signature)}
                            </span>
                        </div>
                     </>)
                })}
            </Form.Item>
            <Row>
                <Col span={24}>
                    <Divider type={'horizontal'} />
                    <Button type="primary" htmlType="submit" onClick={props.handleRouteForward}>
                        ??????????????????????
                    </Button>
                    <Space>
                        <Divider type={'vertical'} />
                        <Button type="primary" htmlType="submit" onClick={props.handleRouteBackward}>?????????????? ???? ??????????????????</Button>
                        <Divider type={'vertical'} />
                        <Button type="primary" htmlType="submit" onClick={props.handleStatusCancelled}>??????????????????</Button>
                    </Space>
                </Col>
                <Col span={24} className="marginTop">
                    <Button onClick={props.modalCancelHandler}>
                        ????????????????
                    </Button>
                    <Divider type={'vertical'} />
                    <Button onClick={props.modalEnableEditHandler}>
                        ??????????????????????????
                    </Button>
                </Col>
            </Row>
            <Divider type={'horizontal'} />
            <Form.Item
                className='font-form-header'
                name="comments"
                label="??????????????????????"
                labelCol={{ span: 24 }}
            >
                <Input.TextArea rows={7} name='comment' onChange={props.HandleCommentOnChange} disabled={props.disabled} />
                <Button disabled={props.disabled} onClick={props.HandleComment} className="marginTop">???????????????? ??????????????????????</Button>
                {props.commentsList.map((item) => {
                    return (
                        <div className='comments'>
                            <li className='comment-item'>
                                <span className='user-name-comment'>{item.username}</span>
                                <span className='user-name-comment'>{item.fio}</span>
                                <span className='user-position-comment'>{item.position}</span>
                                <span className='user-date-time-comment'>{item.date}</span><br />
                                <span className='comment'>{item.comment}</span>
                            </li>
                        </div>

                    )
                })}

            </Form.Item>
            <Form.Item
                name="date_created"
                hidden={true}
            >
            </Form.Item>
            <Form.Item
                name="route_id"
                hidden={true}
            >
            </Form.Item>
            <Form.Item
                name="status_id"
                hidden={true}
            >
            </Form.Item>
            <Form.Item
                name="step"
                hidden={true}
            >
            </Form.Item>
            <Form.Item
                name="log_username"
                hidden={true}
            >
            </Form.Item>
        </Form>
    )
});

export default OnApprovalDocuments;