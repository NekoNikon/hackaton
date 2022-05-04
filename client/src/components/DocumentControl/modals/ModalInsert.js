import { PlusCircleOutlined } from '@ant-design/icons';
import { useMutation,useQuery } from '@apollo/client';
import { Button, Form, Modal, Steps, Divider } from 'antd';
import React, { useState, useEffect } from 'react';
import { handlerMutation, useUser } from '../../../core/functions';

import { gql} from '@apollo/client';
import IndependentSelect from '../../../core/IndependentSelect';

let routesDemo = [
    {
        positionId: 1,
        isExecutor: true, //if this position or user is original creator of agreement ticket
        isLastStep: false,
        description: "Описание",
        accesses: [1, 2, 3, 4, 5],
        substitutes: [2, 3, 4] //id of users who can replace this person
    },
    {
        positionId: 2,
        isExecutor: true,
        isLastStep: false,
        description: "Описание",
        accesses: [1, 2, 3, 4, 5],
        substitutes: [2, 3, 4]
    },
    {
        positionId: 3,
        isExecutor: true,
        isLastStep: true,
        description: "Описание",
        accesses: [1, 2, 3, 4, 5],
        substitutes: [2, 3, 4]
    }
]

let document_routes = {
    exemplar: 'document_routes',
    table: 'document_routes',
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
            query document_routes ($document_routes: JSON) {
                document_routes (document_routes: $document_routes) {
                    id
                    name
                    routes
                    status_in_process
                    status_cancelled
                    status_finished
                }
            }
        `,
        one: gql`
            query document_routes($document_routes: JSON) {
                document_routes(document_routes: $document_routes) {
                    id
                    name
                    routes
                    status_in_process
                    status_cancelled
                    status_finished
                }
            }
        `
    },
    subscription: {
        all: gql`
            subscription document_routes ($document_routes: JSON){
                document_routes (document_routes: $document_routes) {
                    id
                    name
                    routes
                    status_in_process
                    status_cancelled
                    status_finished
                }
            }
        `
    }
};

/*let document_routes_id = {
    exemplar: 'document_routes',
    table: 'document_routes',
    options: {
        all: {
            variables: {
                document_routes: { global: { id: `=${state.route_id}`}}
           },
            fetchPolicy: 'cache-only'
        },
        one: {
            fetchPolicy: 'standby'
        }
    },
    select: {
        all: gql`
            query document_routes ($document_routes: JSON) {
                document_routes (document_routes: $document_routes) {
                    id
                    name
                    routes
                }
            }
        `,
        one: gql`
            query document_routes($document_routes: JSON) {
                document_routes(document_routes: $document_routes) {
                    id
                    name
                    routes
                }
            }
        `
    },
    subscription: {
        all: gql`
            subscription document_routes ($document_routes: JSON){
                document_routes (document_routes: $document_routes) {
                    id
                    name
                    routes
                }
            }
        `
    }
};*/

const { Step } = Steps;

let ModalInsert = React.memo(({ GQL, InsertForm, Form1, ...props }) => {

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [secondModalVisible, setSecondModalVisible] = useState(false);
    const [thirdModalVisible, setThirdModalVisible] = useState(false);
    const [state, setState] = useState({
        
    });

    const user = useUser();

    //modal handling
    const showModal = () => {
        setSecondModalVisible(true);
    };
    const handleOk = () => {
        if (state.route_id != null) {
            setVisible(false)
            showModal();
        }
    };
    /*const handleOk = () => {
        if (state.route_id != null) {
            if (state.route_id == 10) {
                console.log('form', InsertForm)
                setVisible(false)
                showModal();
            }
            if (state.route_id == 23) {
                console.log('form', InsertForm)
                setVisible(false)
                setThirdModalVisible(true)
            }
        }
    };*/
    const handleCancel = () => {
        setSecondModalVisible(false);
        setThirdModalVisible(false)
    };

    //routes manipulation
    const { loading: loadingRoutes, data: dataRoutes, refetch: refetchRoutes } = useQuery(document_routes.select.all, {
        variables: {
            document_routes: {
                global: {
                    id: `=${state.route_id}`,
                }
            }
        }
    });

    useEffect(() => {
        if (state.route_id != null) {
            refetchRoutes();
            console.log('stateEffect',dataRoutes,state)
        }
    }, [state]);
    let [routesList,setRoutesList]= useState([{positionName:'Тип договора не выбран.'}])
    let routesMap = []
    useEffect(() => {
        if (dataRoutes && dataRoutes[Object.keys(dataRoutes)[0]] != null && state.route_id > 0) {
            console.log('dataRoutes', dataRoutes)
            form.setFieldsValue({
                route_id: dataRoutes.document_routes[0].id,
                step: 1,
                status_id: dataRoutes.document_routes[0].status_in_process
            })
            setRoutesList(routesMap = (dataRoutes.document_routes[0].routes != undefined )? dataRoutes.document_routes[0].routes.map((item)=>{
                return{
                    positionName:item.positionName
                }
            }) :[])
        }
    }, [dataRoutes]);


    const [form] = Form.useForm();
    const [visible, setVisible] = useState(false);

    const [insert, { loading }] = handlerMutation(useMutation(GQL.insert), () => { setSecondModalVisible(false); form.resetFields() })();

    //------------------files upload func
    let uploadDocuments = async (files) => {

        console.log(files)
        const filePromises = files.map((file) => {
            // Return a promise per file
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    resolve({ dataFile: e.target.result, fileName: file.name })
                };
                reader.onerror = (error) => {
                    reject(error);
                };
                reader.readAsDataURL(file.originFileObj);
            });
        });

        // Wait for all promises to be resolved
        const fileInfos = await Promise.all(filePromises);

        console.log('COMPLETED');

        // Profit
        return fileInfos;
    };

    return (
        <>
            <Button
                type="primary"
                onClick={() => { setVisible(true) }}
            >
                <PlusCircleOutlined />Создать
            </Button>
            <Modal
                title="Выберите тип договора:"
                onOk={handleOk}
                visible={visible}
                onCancel={() => { setVisible(false) }}
            >
                <Form
                    name="Route_select"
                    onValuesChange={(changedValues, allValues) => { setState(Object.assign({}, state, { ...allValues, })); console.log('state',state) }}
                >
                    <Form.Item
                        name="route_id"
                        rules={[
                            {
                                required: true,
                                message: 'Необходимо выбрать маршрут!',
                                whitespace: true,
                            },
                        ]}
                    >
                        <IndependentSelect placeholder="Тип договора" title="Выберите тип договора:" query={document_routes} />
                    </Form.Item>
                    <Divider type={'horizontal'} />
                    <div className='font-form-header marginTop'>
                        <label>Маршрут:</label>
                    </div>
                    <Steps size="small" current={0} direction="vertical">
                        {
                            routesList.map((item) => {
                                return (
                                    <Step title={item.positionName} />
                                )
                            })
                        }
                    </Steps>
                    {/* <Steps size="small" current={0} className="step-form-input" direction="vertical">
                        <Step title="И.о. начальника ОИТИБ" />
                        <Step title="Юрисконсульт" />
                        <Step title="Начальник ООПЗ" />
                        <Step title="Директор ДМТС" />
                        <Step title="И.о. главного инженера" />
                        <Step title="Заместитель генерального директора по производству"/>
                        <Step title="Заместитель генерального директора по экономике и финансам"/>
                    </Steps> */}
                </Form>
            </Modal>
            <Modal
                title={props.title}
                visible={secondModalVisible}
                onOk={() => { form.submit() }}
                onCancel={handleCancel}
                cancelText='Отмена'
                okText='Отправить на согласование'

                centered
                width={props.width ? props.width : 450}

                maskClosable={false}
                destroyOnClose={true}
                confirmLoading={loading ? loading : false}
            >
                <Form1
                    form={form}
                    onFinish={async (values) => {
                        let variables = {};
                        let base64 = []
                        await uploadDocuments(values.files.fileList).then(result => {
                            base64 = result
                        })
                        values.docs = base64;
                        values.user_id = user.id;
                        values.username = user.username;
                        values.position = user.position_names[0];
                        values.is_read = false;
                        values.fio = user.fio;
                        console.log('TEST', variables)
                        // console.log('TEST', Object.assign(variables,))
                        variables[GQL.exemplar] = values;
                        insert({ variables })

                    }}
                />
            </Modal>
        </>
    );
});



export default ModalInsert;