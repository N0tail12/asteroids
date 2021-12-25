#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include "account.h"
#define MAX 80
#define PORT 8080
#define SA struct sockaddr

account *blockAccount(account *acc)
{
    acc->stt = BLOCKED;
    return acc;
}

account *findAccount(LinkListed **L, char *userName)
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

account *signIn(LinkListed **L, account *acc)
{
    account *tmp = findAccount(L, acc->username);
    if (tmp != NULL && !strcmp(tmp->password, acc->password))
        return tmp;
    return NULL;
}

account *changePass(account *acc, char *oldPass, char *newPass)
{
    if (!strcmp(acc->password, oldPass))
    {
        strcpy(acc->password, newPass);
        return acc;
    }
    return NULL;
}
account *insertAccount(LinkListed **L, account acc)
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

void loadAccounts(LinkListed **L, char *fileName)
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

void printAccount(LinkListed *L)
{
    while (L != NULL)
    {
        printf("%s\n", L->acc.username);
        L = L->next;
    }
}
void updateAccounts(LinkListed **L, char *fileName)
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
