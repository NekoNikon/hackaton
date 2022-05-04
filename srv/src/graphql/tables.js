const tables = {
    "users": {
        "fields": {
            "id": "bigint",
            "username": "character varying",
            "password": "character varying",
            "admin": "boolean",
            "role_id": "bigint",
            "accesses": "json",
            "positions": "json",
            "position_names": "ARRAY(SELECT row_to_json(j.*) FROM (select $*$ from positions AS $Q++$ where id = any(array[(select array(select json_array_elements_text(t.positions):: bigint from users t where id=$Q$.id) from users where id=Q0.id)])) as j) as position_names",
            "domain_username": "character varying",
            "fio": "character varying"
        },
        "where": {
            "id": "id $*$",
            "username": "username $*$",
            "password": "password $*$",
            "admin": "admin $*$",
            "accesses": "accesses $*$",
        },
        "comment": "user"
    },
    "positions": {
        "fields": {
            "id": "bigint",
            "name": "character varying",
            "accesses": "json"
        },
        "where": {
            "id": "id $*$",
            "name": "username $*$",
            "accesses": "accesses $*$",
        },
        "comment": "positions"
    },
    "user_roles": {
        "fields": {
            "id": "bigint",
            "name": "character varying",
        },
        "where": {
            "id": "id $*$",
            "name": "name $*$",
        },
        "comment": "user"
    },
    "application": {
        "fields": {
            "platform_version": "character varying",
            "database_version": "character varying"
        },
        "where": {
        },
        "comment": "application"
    },
    "sessions": {
        "fields": { "sid": "text", "sess": "text", "expire": "timestamp without time zone" },
        "where": { "sid": "sid $*$", "sess": "sess $*$", "expire": "expire $*$" },
        "comment": "session"
    },
    "documents": {
        "fields": {
            "id": "bigint",
            "title": "character varying",
            "description": "character varying",
            "reason": "character varying",
            "subject": "character varying",
            "supllier": "character varying",
            "status_id": "bigint",
            "document_statuses": "(SELECT row_to_json(j.*) AS document_statuses FROM (SELECT $*$ FROM document_statuses AS $Q++$ WHERE id = $Q$.status_id) as j)",
            "route_id": "(SELECT row_to_json(j.*) AS route_id FROM (SELECT $*$ FROM document_routes AS $Q++$ WHERE id = $Q$.route_id) as j)",
            "comments": "ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM document_comments AS $Q++$ WHERE document_id IN (SELECT id FROM documents WHERE id = $Q$.id) $WHERE$ $ORDER_BY$) as j ) AS comments ",
            "signatures": "ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM document_signatures AS $Q++$ WHERE document_id IN (SELECT id FROM documents WHERE id = $Q$.id) $WHERE$ $ORDER_BY$) as j ) AS signatures ",
            "files": "ARRAY(SELECT row_to_json(j.*) FROM (SELECT $*$ FROM document_files AS $Q++$ WHERE filename is not null and document_id IN (SELECT id FROM documents WHERE id = $Q$.id) $WHERE$ $ORDER_BY$) as j ) AS files ",
            "user_id": "bigint",
            "username": "character varying",
            "position": "character varying",
            "fio": "character varying",
            "date_created": "timestamp without time zone",
            "date_modified": "timestamp without time zone",
            "step": "bigint",
            "is_read":"boolean"
            // "array": `(
            //     SELECT
            //         array (SELECT row_to_json(j.*) AS agreement
            //         FROM (SELECT $*$ FROM document_agreeting WHERE document_id = $Q$.id)
            //     as j)
            // ) as array`
        },
        "where": {
            "id": "id $*$",
            "title": "title $*$",
            "description": "description $*$",
            "status_id": "status_id $*$",
            "route_id": "route_id $*$",
            "user_id": "user_id $*$",
            "step": "step $*$",
            "date_created": "date_created $*$",
            "date_modified": "date_modified $*$",
            "is_read": "is_read $*$",
            "positions": "route_id in(select id from (select id, json_array_elements(routes) as elem from document_routes) as docelem where(elem->> 'positionId'):: int = any(array[$*$]))"
        }
    },
    "document_routes": {
        "fields": {
            "id": "bigint",
            "name": "character varying",
            "routes": "json",
            "status_in_process": "bigint",
            "status_cancelled": "bigint",
            "status_finished": "bigint"
        },
        "where": {
            "id": "id $*$",
            "name": "name $*$",
            "routes": "routes $*$"
        }
    },
    "document_statuses": {
        "fields": {
            "id": "bigint",
            "name": "character varying"
        },
        "where": {
            "id": "id $*$",
            "name": "name $*$",
        }
    },
    "document_agreeting": {
        "fields": {
            "document_id": "bigint",
            "document_user": "bigint"
        },
        "where": {
            "document_id": "bigint"
        }
    },
    "document_comments": {
        "fields": {
            "id": "bigint",
            "document_id": "bigint",
            "comment": "character varying",
            "user_id": "bigint",
            "username": "character varying",
            "position": "character varying",
            "fio": "character varying",
            "date": "timestamp without time zone"
        },
        "where": {
            "document_id": "document_id $*$",
            "user_id": "user_id $*$"
        }
    },
    "document_signatures": {
        "fields": {
            "id": "bigint",
            "document_id": "bigint",
            "user_id": "bigint",
            "username": "character varying",
            "position": "character varying",
            "fio": "character varying",
            "date_signature": "timestamp without time zone"
        },
        "where": {
            "document_id": "document_id $*$",
            "user_id": "user_id $*$"
        }
    }
}

module.exports = tables;