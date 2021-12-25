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

// account *blockAccount(account *acc);
// account *findAccount(LinkListed **L, char *userName);
// account *signIn(LinkListed **L, account *acc);
// account *changePass(account *acc, char *oldPass, char *newPass);
// account *insertAccount(LinkListed **L, account acc);

// void loadAccounts(LinkListed **L, char *filename);
// void updateAccounts(LinkListed **L, char *filename);
// int split(char *buffer, char *number, char *letter);