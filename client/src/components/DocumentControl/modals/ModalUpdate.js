import { EyeOutlined } from '@ant-design/icons';
import { useMutation,useQuery,gql } from '@apollo/client';
import { Button, Form, Modal, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { handlerQuery, handlerMutation, useUser } from '../../../core/functions';


const insertComment = gql`
       mutation insertComment($comment: JSON) {
        insertComment(comment: $comment) {
            type
            message
        }
    }
`;

const insertSignature = gql`
       mutation insertSignature($signature: JSON) {
        insertSignature(signature: $signature) {
            type
            message
        }
    }
`;

const comments = gql`
        query document_comments($document_comments: JSON) {
            document_comments(document_comments:$document_comments) {
                id
                comment
                document_id
                user_id
                position
                username
                fio
                date
            }
        }
    `;



let ModalUpdate = React.memo(({ GQL, UpdateForm, ...props }) => {
    const [form] = Form.useForm();
    const [visible, setVisible] = props.visibleModalUpdate;
    const [viewMode, setViewMode] = useState(true);

    const user = useUser();

    //-------modal handling
    let modalCancelHandler = () => {
        setVisible(false); setViewMode(true)
    }

    let modalEnableEditHandler = () => {
        setViewMode(false);
    }

    const { confirm } = Modal;
    function showSendConfirm() {
        confirm({
            title: 'Вы действительно хотите отправить документ?',
            content: `test`,
            okText: 'Отправить',
            cancelText: 'Отмена',
            onOk() { },
            onCancel() { },
        });
    }

    let variables = {}; variables[GQL.table] = { global: { id: `= ${props.selectedRowKeys[0]}` } };
    const { loading: loadingOne, data, refetch } = handlerQuery(GQL, 'one', { variables })();

    //console.log('selectedRowKeys----------------', props.selectedRowKeys,props)

    useEffect(() => { if (data) { form.resetFields() } }, [data]);
    useEffect(() => { if (visible) { refetch() } }, [visible]);
    window.setVisible = setVisible;

    const [update, { loading: loadingUpdate }] = handlerMutation(useMutation(GQL.update), () => { setVisible(false); setViewMode(true) })();


    //---------comments
    const [commentText, setCommentText] = useState();
    let commentVariables = { variables: { document_comments: { global: { document_id: `= ${props.selectedRowKeys[0]}`, ORDER_BY: ['date'] } } } };
    const { loading: loadingComments, data: dataComments, refetch: refetchComments } = useQuery(comments, commentVariables);
    useEffect(() => { if (visible) { refetchComments(commentVariables) } }, [visible]);
    let commentsList = (dataComments && dataComments[Object.keys(dataComments)[0]] != null) ? dataComments[Object.keys(dataComments)[0]].map((item) => {
        return {
            id: item.id,
            key: item.id,
            comment: item.comment ? item.comment : '',
            position: item.position ? item.position: '',
            document_id: item.document_id ? item.document_id : '',
            user_id: item.user_id ? item.user_id : '',
            username: item.username,
            fio: item.fio,
            date: item.date ? item.date : ''
        }
    }) : [];
    //console.log('commentsdata', dataComments)

    const [dataComment, { loading: loadingMutation, error: errorMutation }] = useMutation(insertComment, {
        //refetchQueries: [{ query: comments, variables: commentVariables }],
        onCompleted: (data) => console.log("Data from mutation", data),
        onError: (error) => console.error("Error creating a post", error)
    });
    let handleComment = () => {
        dataComment({ variables: { comment: { user_id: user.id, username: user.username, fio: user.fio, document_id: props.selectedRowKeys[0], position: user.position_names[0], comment: commentText } } });
        refetchComments(commentVariables)
    };
    let HandleCommentOnChange = (all, change) => {
        if (all.target.value.length > 0) {
            setCommentText(all.target.value)
        }
    }
    /*const lastIndexOf = (array, key) => {
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i].key === key)
                return i;
        }
        return -1;
    };*/

    //----------routes && statuses
    const [step, setStep] = useState();
    const [status, setStatus] = useState();
    const [dataSignature, { loading: loadingSignature, error: errorSignature }] = useMutation(insertSignature, {
        onCompleted: (data) => console.log("Data from mutation", data),
        onError: (error) => console.error("Error creating a post", error)
    });

    let handleRouteForward = () => {

        let routeLastRuleIndexData = data.documents[0].route_id.routes[data.documents[0].route_id.routes.length - 1];
        let routeFinishIndex = data.documents[0].route_id.routes.length;
        let routeCurrentIndex = data.documents[0].step;

        //const temp = lastIndexOf(routeFinishIndex2,'positionId')
        //let routeFinishIndex2=routeFinishIndex2.findIndex(obj=>)
        //const lastIndexOf = routeFinishIndex2.reduce((acc, cur, idx) => cur.key == 'positionId' ? idx : acc, -1)
        if (routeCurrentIndex < routeFinishIndex) {
            setStep(routeCurrentIndex + 1)
            dataSignature({ variables: { signature: { user_id: user.id, username: user.username, position: user.position_names[0], fio: user.fio, document_id: props.selectedRowKeys[0] } } });
        }
        else if (routeCurrentIndex = routeFinishIndex) {
            setStep(routeCurrentIndex);
            setStatus(4);
            alert("Конец маршрута, документ утверждён")
        }
     
        //console.log('Initial props', props);
        //console.log('routeFinishIndex', routeFinishIndex, routeCurrentIndex);
    }

    let handleRouteBackward = () => {

        let routeFirstRuleIndexData = data.documents[0].route_id.routes[data.documents[0].route_id.routes.length - 1];
        let routeFirstIndex = 1;
        let routeCurrentIndex = data.documents[0].step;

        //const temp = lastIndexOf(routeFinishIndex2,'positionId')
        //let routeFinishIndex2=routeFinishIndex2.findIndex(obj=>)
        //const lastIndexOf = routeFinishIndex2.reduce((acc, cur, idx) => cur.key == 'positionId' ? idx : acc, -1)
        if (routeCurrentIndex > routeFirstIndex) {
            setStep(routeCurrentIndex - 1)
        }
        else if (routeCurrentIndex = routeFirstIndex) {
            setStep(routeCurrentIndex);
            alert("Достигнуто начало маршрута.")
        }

        //console.log('Initial props', props);
        //console.log('routeFirstIndex', routeFirstIndex, routeCurrentIndex);
    }

    //------------------document statuses
    let handleStatusCancelled=() => {
        setStatus(2);
    };

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
                // width={props.width?props.width:450}
                width={900}
                onOk={() => { form.submit() }}
                onCancel={() => { setVisible(false); setViewMode(true) }}

                maskClosable={false}
                destroyOnClose={true}
                footer={null}
            >
                <Spin spinning={loadingOne}><UpdateForm
                    commentsList={commentsList}
                    HandleComment={handleComment}
                    HandleCommentOnChange={HandleCommentOnChange}

                    handleRouteForward={handleRouteForward}
                    handleRouteBackward={handleRouteBackward}

                    handleStatusCancelled={handleStatusCancelled}

                    modalCancelHandler={modalCancelHandler}
                    modalEnableEditHandler={modalEnableEditHandler}

                    form={form}
                    onFinish={(values) => {
                        let variables = {};
                        console.log('values on finish', values);
                        if (step) { values.step = step };
                        if (status) { values.status_id = status };
                        values.is_read = false
                        variables[GQL.exemplar] = values;
                        update({ variables })
                    }}
                    initialValues={data}
                    disabled={viewMode}
                /></Spin>
            </Modal>
        </>
    );
});

export default ModalUpdate;

 //?data[`${GQL.table}TEST`][0] : data