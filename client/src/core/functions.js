import { notification } from "antd";
import React, { useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { useState } from "react";
import { useLocation, Redirect } from 'react-router-dom';
import Error404 from "../modules/Error404";

import notif_image from "../images/duck.jpg";

export const MergeRecursive = (obj1 = {}, obj2 = {}) => {
    for (var p in obj2) {
        try {
            if (obj2[p].constructor === Object) {
                obj1[p] = MergeRecursive(obj1[p], obj2[p]);
            } else {
                obj1[p] = obj2[p];
            }
        } catch (e) {
            obj1[p] = obj2[p];
        }
    }
    return obj1;
}

export const checkObject = (object, data) => {
    let request = ''
    try {
        request = eval(`object.${data}`);
    } catch (e) {
        return request;
    }
    if (request === undefined) {
        return '';
    }
    return request;
}


export const handlerQuery = (GQL, query, options, auth) => {
    return () => {
        let [subscribe, setSubscribe] = useState(false)
        let reqQuery = useQuery(GQL.select[query], Object.assign({}, MergeRecursive((GQL.options && GQL.options[query]) ? GQL.options[query] : {}, options)))
        useEffect(() => {
            if (reqQuery.error) {
                notification['error']({ message: reqQuery.error.message, duration: 0, placement: 'bottomRight' })
            }
        }, [reqQuery.error]);
        useEffect(() => {
            if (GQL.subscription[query] && reqQuery.data && !subscribe) {
                if (GQL.subscription[query][0]) {
                    for (let value in GQL.subscription[query]) {
                        reqQuery.subscribeToMore({
                            document: GQL.subscription[query][value],
                            variables: Object.assign({}, MergeRecursive((GQL.options && GQL.options[query]) ? GQL.options[query] : {}, options)).variables,
                            updateQuery: (prev, { subscriptionData }) => {
                                if (auth) {
                                    reqQuery.refetch();
                                    return prev;
                                }
                                if (!subscriptionData.data) return prev;
                                return Object.assign({}, prev, { ...prev, ...subscriptionData.data });
                            }
                        })
                    }
                } else {
                    reqQuery.subscribeToMore({
                        document: GQL.subscription[query],
                        variables: Object.assign({}, MergeRecursive((GQL.options && GQL.options[query]) ? GQL.options[query] : {}, options)).variables,
                        updateQuery: (prev, { subscriptionData }) => {
                            if (auth) {
                                reqQuery.refetch();
                                return prev;
                            }
                            if (!subscriptionData.data) return prev;
                            return Object.assign({}, prev, { ...prev, ...subscriptionData.data });
                        }
                    })
                }
                setSubscribe(true);
            }
        }, [reqQuery.data]);

        return reqQuery;
    }
}
export const handlerMutation = ([fn, object], promissOK = () => { }) => {
    return () => {
        useEffect(() => {
            if (!object.loading) {
                if (object.error) {
                    notification['error']({ message: object.error.message, duration: 0, placement: 'bottomRight' })
                }
            }
        }, [object.error]);
        useEffect(() => {
            if (object.data) {
                let request = object.data[Object.keys(object.data)[0]]
                if (request.type == 'warning') {
                    notification['warning']({ message: request.message, duration: 0, placement: 'bottomRight' })
                } else {
                    notification['success']({ message: request.message, duration: 10, placement: 'bottomRight' })
                }
                promissOK();
            }
        }, [object.data]);
        return [fn, object]
    }
}


export const isAccessed = (user, accesses) => {
    if (user.admin) {
        return true
    }
    else {
        return accesses.some(access => user.accesses.includes(access));
    }
}


let authMe = {
    options: {
        //one: { variables: { test: { test: 'test' } } }
    },
    select: {
        one: gql`
            query authMe($test: JSON) {
                authMe(test: $test) {
					id
                    username
                    admin
                    accesses
                    positions
                    domain_username
                    fio
                    position_names
                }
            }
        `
    },
    subscription: {
        one: gql`
            subscription authMe($test: JSON) {
                authMe(test: $test) {
					id
                    username
                    admin
                    accesses
                    positions
                    domain_username
                    fio
                    position_names
                }
            }

        `
    }
}

let positions = gql`
            query positions ($positions: JSON) {
                positions (positions: $positions) {
                    id
                    name
                    accesses
                }
            }
        `;

export const useUser = () => {

    let variables = {};

    let query = handlerQuery(authMe, 'one', { variables }, 'auth')();

    const { loading: positionsLoading, data: positionsData, refetch: positionsRefetch } = useQuery(positions);

    /*const { loading: positionsLoading, data: positionsData, refetch: positionsRefetch } = useQuery(
        positions, {
            onCompleted: (data) => {
                setPos(data)
            }
    });*/

    let user = query.data ? query.data.authMe[0] : undefined;
    let positionNames = user ? query.data.authMe[0].position_names : [];

    //let accesses = user ? query.data.authMe[0].accesses : [];
    let accessesData = user && user.positions ? positionsData?.positions.filter((el) => { return el.id == user.positions[0] }) : [];
    let accesses = accessesData && accessesData[0] ? accessesData[0].accesses : [];

    let admin = user ? user.admin : undefined;
    //console.log('positionNames', positionNames)
    return {
        query,
        id: user ? user.id : undefined,
        username: user ? user.username : undefined,
        domain_username: user ? user.domain_username : undefined,
        fio: user ? user.fio : undefined,
        admin: user ? user.admin : undefined,
        role_id: user ? user.role_id : undefined,
        positions: admin ? [1, 2, 3, 4, 5, 6] : user?.positions,
        position_names: positionNames,
        documentControl: {
            select: admin ? true : accesses.includes('/document-control-p/select'),
            insert: admin ? true : accesses.includes('/document-control-p/insert'),
            update: admin ? true : accesses.includes('/document-control-p/update'),
            delete: admin ? true : accesses.includes('/document-control-p/delete'),
            approved: {
                select: admin ? true : accesses.includes('/document-control-p/approved-p/select')
            },
            onApproval: {
                select: admin ? true : accesses.includes('/document-control-p/on-approval-p/select')
            },
            rejected: {
                select: admin ? true : accesses.includes('/document-control-p/rejected-p/select')
            },
            approvedUser: {
                select: admin ? true : accesses.includes('/document-control-p/approveduser-p/select')
            },
            rejectedUser: {
                select: admin ? true : accesses.includes('/document-control-p/rejecteduser-p/select')
            },
            isDocumentStatusChangeAllowed: admin ? true : accesses.includes('/document-control-p/document-status-change'),
            isItemStatusChangeAllowed: admin ? true : accesses.includes('/document-control-p/item-status-change'),
        },
        documentReport: {
            select: admin ? true : accesses.includes('/document-report-p/select'),
            insert: admin ? true : accesses.includes('/document-report-p/insert'),
            update: admin ? true : accesses.includes('/document-report-p/update'),
            delete: admin ? true : accesses.includes('/document-report-p/delete'),
            isDocumentStatusChangeAllowed: admin ? true : accesses.includes('/document-report-p/document-status-change'),
            isItemStatusChangeAllowed: admin ? true : accesses.includes('/document-report-p/item-status-change'),
        },
        documentHistory: {
            select: admin ? true : accesses.includes('/document-history-p/select'),
            insert: admin ? true : accesses.includes('/document-history-p/insert'),
            update: admin ? true : accesses.includes('/document-history-p/update'),
            delete: admin ? true : accesses.includes('/document-history-p/delete'),
            isDocumentStatusChangeAllowed: admin ? true : accesses.includes('/document-history-p/document-status-change'),
            isItemStatusChangeAllowed: admin ? true : accesses.includes('/document-history-p/item-status-change'),
        },
        documentSearch: {
            select: admin ? true : accesses.includes('/document-search-p/select'),
            insert: admin ? true : accesses.includes('/document-search-p/insert'),
            update: admin ? true : accesses.includes('/document-search-p/update'),
            delete: admin ? true : accesses.includes('/document-search-p/delete'),
            isDocumentStatusChangeAllowed: admin ? true : accesses.includes('/document-search-p/document-status-change'),
            isItemStatusChangeAllowed: admin ? true : accesses.includes('/document-search-p/item-status-change'),
        },
        adminDepartment: {
            select: admin ? true : accesses.includes('/admin-p/select'),
            insert: admin ? true : accesses.includes('/admin-p/insert'),
            update: admin ? true : accesses.includes('/admin-p/update'),
            delete: admin ? true : accesses.includes('/admin-p/delete'),
            isDocumentStatusChangeAllowed: admin ? true : accesses.includes('/admin-p/document-status-change'),
            isItemStatusChangeAllowed: admin ? true : accesses.includes('/admin-p/item-status-change'),
        }
    }
};

export const accessRedirect = (Component) => {
    let accessRedirect = (props) => {
        let { pathname } = (() => { return useLocation() })();
        let user = (() => { return useUser() })();

        //console.log(pathname);
        const path_test = pathname.split("/");
        //console.log('path_test',path_test);
        if (user.query.loading) { return <>Loading...</> }
        switch (pathname) {
            case '/':
                if (!user.username) { return <Redirect to='/login' /> } break;
            case '/login': case '/login/':
                if (user.username) { return <Redirect to='/' /> } break;
            case '/logout': case '/logout/':
                if (!user.username) { return <Redirect to='/' /> } break;
            // Account
            case '/account': case '/account/':
                if (!user.username) { return <Redirect to='/account' /> } break;

            // admin
            case '/admin': case '/admin/':
                if (!user.admin) { return <Redirect /> } break;
            case '/graphql': case '/graphql/':
                if (!user.admin) { return <Redirect /> } break;
            case '/admin/registration': case '/admin/registration/':
                if (!user.admin) { return <Redirect /> } break;
            case '/admin/positions-page': case '/admin/positions-page/':
                if (!user.admin) { return <Redirect /> } break;
            case '/admin/document-statuses-page': case '/admin/document-statuses-page/':
                if (!user.admin) { return <Redirect /> } break;
            case '/admin/document-routes-page': case '/admin/document-routes-page/':
                if (!user.admin) { return <Redirect /> } break;

            //components
            case '/document-control': case '/document-control/': case '/document-control/' + path_test[2]:
                if (!user.documentControl.select) { return <Redirect /> } break;
            case '/document-control/my': case '/document-control/my/': case '/document-control/my/' + path_test[2]:
                if (!user.documentControl.select) { return <Redirect /> } break;

            case '/document-control/approved': case '/document-control/approved/': case '/document-control/approved/' + path_test[2]:
                if (!user.documentControl.approved.select) { return <Redirect /> } break;
            case '/document-control/on-approval': case '/document-control/on-approval/': case '/document-control/on-approval/' + path_test[2]:
                if (!user.documentControl.onApproval.select) { return <Redirect /> } break;
            case '/document-control/rejected': case '/document-control/rejected/': case '/document-control/rejected/' + path_test[2]:
                if (!user.documentControl.rejected.select) { return <Redirect /> } break;

            case '/document-control/approveduser': case '/document-control/approveduser/': case '/document-control/approveduser/' + path_test[2]:
                if (!user.documentControl.approvedUser.select) { return <Redirect /> } break;
            case '/document-control/rejecteduser': case '/document-control/rejecteduser/': case '/document-control/rejecteduser/' + path_test[2]:
                if (!user.documentControl.rejectedUser.select) { return <Redirect /> } break;

            case '/document-report': case '/document-report/': case '/document-report/' + path_test[2]:
                if (!user.documentReport.select) { return <Redirect /> } break;
            case '/document-history': case '/document-history/': case '/document-history/' + path_test[2]:
                if (!user.documentHistory.select) { return <Redirect /> } break;
            // case '/admin-department': case '/admin-department/': case '/admin-department/' + path_test[2]:
            //     if (!user.adminDepartment.select) { return <Redirect /> } break;
            case '/document-search': case '/document-search/': case '/document-search/' + path_test[2]:
                if (!user.documentSearch.select) { return <Redirect /> } break;

            default:
                return <Error404 />;
        }
        return <Component {...props} />
    }

    return accessRedirect;
}


export const download = async (url, filename) => {
    let response = await fetch(url, {
        mode: 'no-cors'
        /*
        * ALTERNATIVE MODE {
        mode: 'cors'
        }
        *
        */
    });
    try {
        let data = await response.blob();
        let elm = document.createElement('a');  // CREATE A LINK ELEMENT IN DOM
        elm.href = URL.createObjectURL(data);  // SET LINK ELEMENTS CONTENTS
        elm.setAttribute('download', filename); // SET ELEMENT CREATED 'ATTRIBUTE' TO DOWNLOAD, FILENAME PARAM AUTOMATICALLY
        elm.click();                             // TRIGGER ELEMENT TO DOWNLOAD
        elm.remove();
    }
    catch (err) {
        console.log(err);
    }
}

export const getDDMMYYY = (date = new Date) => {
    let today = new Date(date);
    let dd = today.getDate();
    let mm = today.getMonth() + 1; //January is 0!
    let yyyy = today.getFullYear();

    if (dd < 10) {
        dd = '0' + dd
    }
    if (mm < 10) {
        mm = '0' + mm
    }

    today = dd + '-' + mm + '-' + yyyy;
    return today;
}

export const getFirstMonthDate = (anydate = new Date) => {
    let today_tmp = new Date(anydate);
    let today = new Date(today_tmp.getTime() - today_tmp.getTimezoneOffset() * 60 * 1000);
    let myDate = today;
    myDate.setHours(0, 0, 0, 0); // начало текущего дня
    myDate.setMonth(myDate.getMonth() + 1, 0); // февраль текущего года
    myDate.setDate(1); // 1 число февраля текущего года
    return myDate;
}

export const formatDate = (timestamp = new Date) => {
    let d = timestamp.split(/[^\d]+/);
    d = d[2] + "-" + d[1] + "-" + d[0] + " " + d[3] + ":" + d[4] + ":" + d[5];
    return d;
}

export const notifyMe = (text) => {
    if (!window.Notification) {
        console.log('Browser does not support notifications.');
    } else if (text) {
        // check if permission is already granted
        if (Notification.permission === 'granted') {
            // show notification here
            let notify = new Notification('Согласование договоров', {
                title: 'Тест',
                body: text,
                icon: notif_image,
                requireInteraction: false
            });
        } else {
            // request permission from user
            Notification.requestPermission().then(function (p) {
                if (p === 'granted') {
                    // show notification here
                    let notify = new Notification('Согласование договоров', {
                        title: 'Тест',
                        body: text,
                        icon: notif_image,
                        requireInteraction: false
                    });
                } else {
                    console.log('User blocked notifications.');
                }
            }).catch(function (err) {
                console.error(err);
            });
        }
    }
}