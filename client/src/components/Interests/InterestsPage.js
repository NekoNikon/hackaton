import { Divider, Row, Col, Select, Tag } from 'antd';
import { Layout } from 'antd';
import React, { useState } from 'react';
import { useUser, accessRedirect } from '../../core/functions';
import Header1 from '../../core/Header1';
import { Table, Space, Typography } from 'antd';
import {
    Form,
    Button,
    DatePicker
} from 'antd';
import { Context } from "../../core/Context";

import Search from 'antd/lib/input/Search';
import { gql, useQuery, useSubscription } from '@apollo/client';
import { notifyMe } from '../../core/functions';
import { useHistory } from 'react-router-dom';
import InterestsTags from './InterestsTags';
import InterestsAccounts from './InterestsAccounts';
import InterestsProf from './InterestsProf';


const { RangePicker } = DatePicker;
const { Title } = Typography;
const pagination = { position: 'bottom' };
const { Option } = Select;

const { Content } = Layout


let InterestsPage = () => {
    const [context, setContext] = useState("default context value");
    const user = useUser();
    const [tags, setTags] = useState(['Tag 1', 'Tag 2', 'Tag 3'])
    const [inputVisible, setInputVisible] = useState()
    const [inputValue, setInputValue] = useState('')

    let list_prof = [
        "Учитель информатики",
        "Архитектор программного обеспечения"
    ]

    const style = { background: '#0092ff', padding: '8px 0' };

    return (
        <Context.Provider value={[context, setContext]}>
            <Layout>
                <Header1 title={'Интересы'} user={user} />
                <Layout>

                    <Layout className="content-layout">
                        <Content className="site-layout-background"
                            style={{
                                padding: 24,
                                margin: 0,
                                // minHeight: 280
                            }}>
                            <Divider type='horizontal' />
                            <InterestsTags />
                            <Divider type='horizontal' />
                            <Row>
                                <Col flex={3}>
                                    <div>
                                        <InterestsAccounts type_acc={"Litres"} />
                                        <InterestsAccounts type_acc={"Kundelik"} />
                                        <InterestsAccounts type_acc={"Google.Account"} />
                                    </div>
                                </Col>

                                <Col flex={1}>
                                    <div>
                                        <InterestsProf prof_data={list_prof} />
                                    </div>
                                </Col>
                            </Row>

                        </Content>
                    </Layout>
                </Layout>
            </Layout>
        </Context.Provider>
    )
}

export default InterestsPage