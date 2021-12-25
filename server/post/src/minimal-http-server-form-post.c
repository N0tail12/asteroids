/*
 * lws-minimal-http-server-form-post
 *
 * Written in 2010-2019 by Andy Green <andy@warmcat.com>
 *
 * This file is made available under the Creative Commons CC0 1.0
 * Universal Public Domain Dedication.
 *
 * This demonstrates a minimal http server that performs POST with a couple
 * of parameters.  It dumps the parameters to the console log and redirects
 * to another page.
 */

#include <libwebsockets.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <ctype.h>
#define MAX 80

/*
 * Unlike ws, http is a stateless protocol.  This pss only exists for the
 * duration of a single http transaction.  With http/1.1 keep-alive and http/2,
 * that is unrelated to (shorter than) the lifetime of the network connection.
 */
struct pss
{
	struct lws_spa *spa;
};

static int interrupted, use303;

static const char *const param_names[] = {
	"username",
	"passwd",
	"username_login",
	"passwd_login",
};

enum enum_param_names
{
	EPN_TEXT1,
	EPN_SEND,
};

typedef enum {
    BLOCKED,
    ACTIVE,
    IDLE
}status;

typedef struct {
    char username[30];
    char password[30];
    status stt;
}account;

typedef struct LinkListed{
    account acc;
    struct LinkListed *next;
}LinkListed;

static account *blockAccount(account *acc)
{
    acc->stt = BLOCKED;
    return acc;
}

static account *findAccount(LinkListed **L, char *userName)
{
    LinkListed *node = *L;
    while (node != NULL)
    {
        if (!strcmp(node->acc.username, userName))
        {

            return &node->acc;
        }
        node = node->next;
    }
    return NULL;
}

static account *signIn(LinkListed **L, account *acc)
{
    account *tmp = findAccount(L, acc->username);
    if (tmp != NULL && !strcmp(tmp->password, acc->password))
        return tmp;
    return NULL;
}

static account *changePass(account *acc, char *oldPass, char *newPass)
{
    if (!strcmp(acc->password, oldPass))
    {
        strcpy(acc->password, newPass);
        return acc;
    }
    return NULL;
}
static account *insertAccount(LinkListed **L, account acc)
{
    LinkListed *tmp = NULL;
    LinkListed *node = *L;
    while (node != NULL)
    {
        if (!strcmp(node->acc.username, acc.username))
            break;
        tmp = node;
        node = node->next;
    }
    if (tmp == NULL)
    {
        *L = malloc(sizeof(LinkListed));
        (*L)->acc = acc;
        (*L)->next = NULL;
        return &(*L)->acc;
    }
    else if (node != NULL)
    {
        return NULL;
    }
    else
    {
        tmp->next = malloc(sizeof(LinkListed));
        tmp->next->acc = acc;
        tmp->next->next = NULL;
        return &tmp->next->acc;
    }
}

static void loadAccounts(LinkListed **L, char *fileName)
{
    FILE *file = fopen(fileName, "r");
    if (file == NULL)
    {
        printf("Cannot open file.");
        exit(1);
    }
    else
    {
        account acc;
        char line[100];
        while (fgets(line, 100, file) > 0)
        {
            if (sscanf(line, "%s %s %d", acc.username, acc.password, (int *)&acc.stt) == 3)
            {
                insertAccount(L, acc);
            }
        }
    }
    fclose(file);
}

static void printAccount(LinkListed *L)
{
    while (L != NULL)
    {
        printf("%s\n", L->acc.username);
        L = L->next;
    }
}
static void updateAccounts(LinkListed **L, char *fileName)
{
    FILE *file = fopen(fileName, "w");
    LinkListed *node = *L;
    while (node != NULL)
    {
        fprintf(file, "%s %s %d\n", node->acc.username, node->acc.password, node->acc.stt);
        node = node->next;
    }
    fclose(file);
}



static int
callback_http(struct lws *wsi, enum lws_callback_reasons reason, void *user,
			  void *in, size_t len)
{
	LinkListed *L = NULL;
    account *exist = NULL;
	account *newClient = malloc(sizeof(account));
	char username[MAX]; 
	char passwd[MAX]; 
    loadAccounts(&L, "D:\\Document\\THLTmang\\testlib\\minimal-http-server-form-post\\src\\accounts.txt");
	struct pss *pss = (struct pss *)user;
	uint8_t buf[LWS_PRE + LWS_RECOMMENDED_MIN_HEADER_SPACE], *start = &buf[LWS_PRE],
															 *p = start, *end = &buf[sizeof(buf) - 1];
	int n;

	switch (reason)
	{
	case LWS_CALLBACK_HTTP:

		/*
		 * Manually report that our form target URL exists
		 *
		 * you can also do this by adding a mount for the form URL
		 * to the protocol with type LWSMPRO_CALLBACK, then no need
		 * to trap LWS_CALLBACK_HTTP.
		 */

		if (!strcmp((const char *)in, "/form1"))
			/* assertively allow it to exist in the URL space */
			return 0;

		/* default to 404-ing the URL if not mounted */
		break;

	case LWS_CALLBACK_HTTP_BODY:

		/* create the POST argument parser if not already existing */

		if (!pss->spa)
		{
			pss->spa = lws_spa_create(wsi, param_names,
									  LWS_ARRAY_SIZE(param_names), 1024,
									  NULL, NULL); /* no file upload */
			if (!pss->spa)
				return -1;
			lwsl_user("SPA created");
		}
		/* let it parse the POST data */

		if (lws_spa_process(pss->spa, in, (int)len))
			return -1;
		break;

	case LWS_CALLBACK_CLOSED_CLIENT_HTTP:
		if (pss->spa && lws_spa_destroy(pss->spa))
			return -1;
		break;

	case LWS_CALLBACK_HTTP_BODY_COMPLETION:

		/* inform the spa no more payload data coming */

		lwsl_user("LWS_CALLBACK_HTTP_BODY_COMPLETION\n");
		lws_spa_finalize(pss->spa);

		/* we just dump the decoded things to the log */

		if (pss->spa)
			for (n = 0; n < (int)LWS_ARRAY_SIZE(param_names); n++)
			{
				if (!lws_spa_get_string(pss->spa, n))
					lwsl_user("%s: undefined\n", param_names[n]);
				else {
					lwsl_user("%s: (len %d) '%s'\n",
							  param_names[n],
							  lws_spa_get_length(pss->spa, n),
							  lws_spa_get_string(pss->spa, n));
					if(!strcmp(param_names[n], "username")) {
						strcpy(username, lws_spa_get_string(pss->spa, n));
					}
					if(!strcmp(param_names[n], "passwd")) {
						strcpy(passwd, lws_spa_get_string(pss->spa, n));
					}
				}
			}

		/*
		 * Our response is to redirect to a static page.  We could
		 * have generated a dynamic html page here instead.
		 */
		exist = findAccount(&L, username);
		if (!exist) {
			lws_http_redirect(wsi, use303 ? HTTP_STATUS_SEE_OTHER : HTTP_STATUS_MOVED_PERMANENTLY,
							  (unsigned char *)"login.html",
							  10, &p, end);
		} else {
			if(!strcmp(exist->password, passwd)){
			lws_http_redirect(wsi, use303 ? HTTP_STATUS_SEE_OTHER : HTTP_STATUS_MOVED_PERMANENTLY,
							  (unsigned char *)"after-menu.html",
							  15, &p, end);
			}
		}

			return -1;
		break;

	case LWS_CALLBACK_HTTP_DROP_PROTOCOL:
		/* called when our wsi user_space is going to be destroyed */
		if (pss->spa)
		{
			lws_spa_destroy(pss->spa);
			pss->spa = NULL;
		}
		break;

	default:
		break;
	}

	return lws_callback_http_dummy(wsi, reason, user, in, len);
}

static struct lws_protocols protocols[] = {
	{"http", callback_http, sizeof(struct pss), 0, 0, NULL, 0},
	LWS_PROTOCOL_LIST_TERM};

/* default mount serves the URL space from ./mount-origin */

static const struct lws_http_mount mount = {
	/* .mount_next */ NULL,			/* linked-list "next" */
	/* .mountpoint */ "/",			/* mountpoint URL */
	/* .origin */ "./mount-origin/login", /* serve from dir */
	/* .def */ "login.html",		/* default filename */
	/* .protocol */ NULL,
	/* .cgienv */ NULL,
	/* .extra_mimetypes */ NULL,
	/* .interpret */ NULL,
	/* .cgi_timeout */ 0,
	/* .cache_max_age */ 0,
	/* .auth_mask */ 0,
	/* .cache_reusable */ 0,
	/* .cache_revalidate */ 0,
	/* .cache_intermediaries */ 0,
	/* .origin_protocol */ LWSMPRO_FILE, /* files in a dir */
	/* .mountpoint_len */ 1,			 /* char count */
										 // /* .basic_auth_login_file */	NULL,
};

void sigint_handler(int sig)
{
	interrupted = 1;
}

int main(int argc, const char **argv)
{
	struct lws_context_creation_info info;
	struct lws_context *context;
	const char *p;
	int n = 0, logs = LLL_USER | LLL_ERR | LLL_WARN | LLL_NOTICE
		/* for LLL_ verbosity above NOTICE to be built into lws,
		 * lws must have been configured and built with
		 * -DCMAKE_BUILD_TYPE=DEBUG instead of =RELEASE */
		/* | LLL_INFO */ /* | LLL_PARSER */ /* | LLL_HEADER */
		/* | LLL_EXT */ /* | LLL_CLIENT */	/* | LLL_LATENCY */
		/* | LLL_DEBUG */;

	signal(SIGINT, sigint_handler);

	if ((p = lws_cmdline_option(argc, argv, "-d")))
		logs = atoi(p);

	lws_set_log_level(logs, NULL);
	lwsl_user("LWS minimal http server POST | visit http://localhost:7681\n");

	memset(&info, 0, sizeof info); /* otherwise uninitialized garbage */
	info.port = 7681;
	info.protocols = protocols;
	info.mounts = &mount;
	info.options =
		LWS_SERVER_OPTION_HTTP_HEADERS_SECURITY_BEST_PRACTICES_ENFORCE;
#if defined(LWS_WITH_TLS)
	if (lws_cmdline_option(argc, argv, "-s"))
	{
		info.options |= LWS_SERVER_OPTION_DO_SSL_GLOBAL_INIT;
		info.ssl_cert_filepath = "localhost-100y.cert";
		info.ssl_private_key_filepath = "localhost-100y.key";
	}
#endif

	if ((p = lws_cmdline_option(argc, argv, "--port")))
		info.port = atoi(p);

	if (lws_cmdline_option(argc, argv, "--303"))
	{
		lwsl_user("%s: using 303 redirect\n", __func__);
		use303 = 1;
	}

	context = lws_create_context(&info);
	if (!context)
	{
		lwsl_err("lws init failed\n");
		return 1;
	}

	while (n >= 0 && !interrupted)
		n = lws_service(context, 0);

	lws_context_destroy(context);

	return 0;
}
