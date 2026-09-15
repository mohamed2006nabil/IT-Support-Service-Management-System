import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  TicketsService,
  Ticket
} from '../../services/tickets';

import {
  CommentsService,
  Comment
} from '../../services/comments';

import {
  AttachmentsService,
  Attachment
} from '../../services/attachments';


@Component({
  selector: 'app-agent-ticket-details',

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './agent-ticket-details.html',

  styleUrl: './agent-ticket-details.css'
})
export class AgentTicketDetails implements OnInit {


  ticket = signal<Ticket | null>(null);


  comments = signal<Comment[]>([]);

  newCommentText = signal('');

  isAddingComment = signal(false);


  attachments = signal<Attachment[]>([]);

  selectedFile = signal<File | null>(null);

  isUploadingAttachment = signal(false);


  /* Delete Modal */

  showDeleteModal = signal(false);

  attachmentToDelete =
    signal<Attachment | null>(null);

  isDeletingAttachment = signal(false);


  statuses = signal<any[]>([]);

  isEditingStatus = signal(false);

  selectedStatusId = signal<number>(0);

  isSaving = signal(false);


  showSuccess = signal(false);

  showError = signal(false);

  errorMessage = signal(
    'Failed to update ticket status.'
  );


  private platformId =
    inject(PLATFORM_ID);


  constructor(
    private route: ActivatedRoute,

    private router: Router,

    private ticketsService: TicketsService,

    private commentsService: CommentsService,

    private attachmentsService: AttachmentsService
  ) {}


  ngOnInit(): void {

    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {

      const ticketId =
        Number(
          this.route.snapshot
            .paramMap
            .get('id')
        );


      if (!ticketId) {

        this.router.navigate([
          '/agent-tickets'
        ]);

        return;
      }


      /* Ticket */

      this.ticketsService
        .getTicketById(ticketId)
        .subscribe({

          next: (data) => {

            this.ticket.set(data);

            this.selectedStatusId.set(
              data.statusId
            );

            console.log(
              'Agent ticket details loaded:',
              data
            );

          },

          error: (error) => {

            console.error(
              'Failed to load agent ticket details:',
              error
            );

            this.router.navigate([
              '/agent-tickets'
            ]);

          }

        });


      /* Statuses */

      this.ticketsService
        .getStatuses()
        .subscribe({

          next: (data) => {

            this.statuses.set(data);

            console.log(
              'Statuses loaded:',
              data
            );

          },

          error: (error) => {

            console.error(
              'Failed to load statuses:',
              error
            );

          }

        });


      /* Comments */

      this.commentsService
        .getComments()
        .subscribe({

          next: (data) => {

            const ticketComments =
              data.filter(
                comment =>
                  comment.ticketId ===
                  ticketId
              );

            this.comments.set(
              ticketComments
            );

            console.log(
              'Ticket comments loaded:',
              ticketComments
            );

          },

          error: (error) => {

            console.error(
              'Failed to load comments:',
              error
            );

          }

        });


      /* Attachments */

      this.attachmentsService
        .getAttachments()
        .subscribe({

          next: (data) => {

            const ticketAttachments =
              data.filter(
                attachment =>
                  attachment.ticketId ===
                  ticketId
              );

            this.attachments.set(
              ticketAttachments
            );

            console.log(
              'Ticket attachments loaded:',
              ticketAttachments
            );

          },

          error: (error) => {

            console.error(
              'Failed to load ticket attachments:',
              error
            );

          }

        });

    }

  }


  /* ========================================
     Status Workflow
  ======================================== */

  getAvailableStatuses(): any[] {

    const currentTicket =
      this.ticket();


    if (!currentTicket) {
      return [];
    }


    const currentStatusId =
      currentTicket.statusId;


    let allowedStatusIds:
      number[] = [];


    switch (currentStatusId) {

      case 1:
        allowedStatusIds = [1, 2];
        break;

      case 2:
        allowedStatusIds = [2, 3];
        break;

      case 3:
        allowedStatusIds = [3, 4, 5];
        break;

      case 4:
        allowedStatusIds = [4, 5];
        break;

      case 5:
        allowedStatusIds = [5, 2];
        break;

      default:
        allowedStatusIds = [
          currentStatusId
        ];

    }


    return this.statuses().filter(
      status =>
        allowedStatusIds.includes(
          status.id
        )
    );

  }


  startEditingStatus() {

    const currentTicket =
      this.ticket();


    if (!currentTicket) {
      return;
    }


    this.selectedStatusId.set(
      currentTicket.statusId
    );

    this.showSuccess.set(false);

    this.showError.set(false);

    this.isEditingStatus.set(true);

  }


  cancelEditingStatus() {

    const currentTicket =
      this.ticket();


    if (currentTicket) {

      this.selectedStatusId.set(
        currentTicket.statusId
      );

    }


    this.showError.set(false);

    this.isEditingStatus.set(false);

  }


  saveStatus() {

    const currentTicket =
      this.ticket();


    if (
      !currentTicket ||
      this.isSaving()
    ) {
      return;
    }


    const newStatusId =
      Number(
        this.selectedStatusId()
      );


    if (
      newStatusId ===
      currentTicket.statusId
    ) {

      this.isEditingStatus.set(false);

      return;
    }


    this.isSaving.set(true);

    this.showSuccess.set(false);

    this.showError.set(false);


    const updatedTicket = {

      title:
        currentTicket.title,

      description:
        currentTicket.description,

      userId:
        currentTicket.userId,

      assignedToId:
        currentTicket.assignedToId,

      categoryId:
        currentTicket.categoryId,

      priorityId:
        currentTicket.priorityId,

      statusId:
        newStatusId,

      resolvedAt:
        currentTicket.resolvedAt,

      closedAt:
        currentTicket.closedAt

    };


    this.ticketsService
      .updateTicket(
        currentTicket.id,
        updatedTicket
      )
      .subscribe({

        next: () => {

          this.ticketsService
            .getTicketById(
              currentTicket.id
            )
            .subscribe({

              next: (
                updatedTicket
              ) => {

                this.ticket.set(
                  updatedTicket
                );

                this.selectedStatusId.set(
                  updatedTicket.statusId
                );


                console.log(
                  'Ticket status updated successfully:',
                  updatedTicket
                );


                setTimeout(() => {

                  this.isSaving.set(false);

                  this.isEditingStatus.set(
                    false
                  );

                  this.showSuccess.set(
                    true
                  );


                  setTimeout(() => {

                    this.showSuccess.set(
                      false
                    );

                  }, 2500);

                }, 2000);

              },


              error: (error) => {

                console.error(
                  'Failed to reload updated ticket:',
                  error
                );

                this.isSaving.set(false);

                this.showError.set(true);

                this.errorMessage.set(
                  'Ticket was updated, but the latest data could not be loaded.'
                );


                setTimeout(() => {

                  this.showError.set(false);

                }, 4000);

              }

            });

        },


        error: (error) => {

          console.error(
            'Failed to update ticket status:',
            error
          );

          this.isSaving.set(false);

          this.showError.set(true);


          if (
            error?.error?.message
          ) {

            this.errorMessage.set(
              error.error.message
            );

          }
          else {

            this.errorMessage.set(
              'Failed to update ticket status.'
            );

          }


          setTimeout(() => {

            this.showError.set(false);

          }, 4000);

        }

      });

  }


  /* ========================================
     Comments
  ======================================== */

  addComment() {

    const currentTicket =
      this.ticket();


    const userData =
      localStorage.getItem('user');


    if (
      !currentTicket ||
      !userData ||
      this.isAddingComment()
    ) {
      return;
    }


    const user =
      JSON.parse(userData);


    const commentText =
      this.newCommentText().trim();


    if (!commentText) {
      return;
    }


    this.isAddingComment.set(true);


    this.commentsService
      .addComment(
        currentTicket.id,
        user.userId,
        commentText
      )
      .subscribe({

        next: (newComment) => {

          this.comments.set([
            ...this.comments(),
            newComment
          ]);


          this.newCommentText.set('');

          this.isAddingComment.set(
            false
          );


          console.log(
            'Comment added successfully:',
            newComment
          );

        },


        error: (error) => {

          console.error(
            'Failed to add comment:',
            error
          );

          this.isAddingComment.set(
            false
          );

        }

      });

  }


  /* ========================================
     Attachments
  ======================================== */

  onFileSelected(event: Event) {

    const input =
      event.target as HTMLInputElement;


    if (
      !input.files ||
      input.files.length === 0
    ) {

      this.selectedFile.set(null);

      return;
    }


    this.selectedFile.set(
      input.files[0]
    );

  }


  uploadAttachment() {

    const currentTicket =
      this.ticket();


    const userData =
      localStorage.getItem('user');


    const file =
      this.selectedFile();


    if (
      !currentTicket ||
      !userData ||
      !file ||
      this.isUploadingAttachment()
    ) {
      return;
    }


    const user =
      JSON.parse(userData);


    this.isUploadingAttachment.set(
      true
    );


    this.attachmentsService
      .uploadAttachment(
        file,
        currentTicket.id,
        user.userId
      )
      .subscribe({

        next: (newAttachment) => {

          this.attachments.set([
            ...this.attachments(),
            newAttachment
          ]);


          this.selectedFile.set(null);


          this.isUploadingAttachment.set(
            false
          );


          console.log(
            'Attachment uploaded successfully:',
            newAttachment
          );

        },


        error: (error) => {

          console.error(
            'Failed to upload attachment:',
            error
          );


          this.isUploadingAttachment.set(
            false
          );

        }

      });

  }


  downloadAttachment(
    attachment: Attachment
  ) {

    this.attachmentsService
      .downloadAttachment(
        attachment.id
      )
      .subscribe({

        next: (blob) => {

          const url =
            window.URL.createObjectURL(
              blob
            );


          const link =
            document.createElement('a');


          link.href = url;

          link.download =
            attachment.fileName;


          link.click();


          window.URL.revokeObjectURL(
            url
          );

        },


        error: (error) => {

          console.error(
            'Failed to download attachment:',
            error
          );

        }

      });

  }


  /* ========================================
     Delete Attachment Modal
  ======================================== */

  deleteAttachment(
    attachment: Attachment
  ) {

    this.attachmentToDelete.set(
      attachment
    );

    this.showDeleteModal.set(
      true
    );

  }


  cancelDelete() {

    if (
      this.isDeletingAttachment()
    ) {
      return;
    }


    this.showDeleteModal.set(
      false
    );

    this.attachmentToDelete.set(
      null
    );

  }


  confirmDelete() {

    const attachment =
      this.attachmentToDelete();


    if (
      !attachment ||
      this.isDeletingAttachment()
    ) {
      return;
    }


    this.isDeletingAttachment.set(
      true
    );


    this.attachmentsService
      .deleteAttachment(
        attachment.id
      )
      .subscribe({

        next: () => {

          this.attachments.set(
            this.attachments().filter(
              item =>
                item.id !==
                attachment.id
            )
          );


          this.isDeletingAttachment.set(
            false
          );


          this.showDeleteModal.set(
            false
          );


          this.attachmentToDelete.set(
            null
          );


          console.log(
            'Attachment deleted successfully.'
          );

        },


        error: (error) => {

          console.error(
            'Failed to delete attachment:',
            error
          );


          this.isDeletingAttachment.set(
            false
          );

        }

      });

  }


  /* ========================================
     Helpers
  ======================================== */

  getStatusName(
    statusId: number
  ): string {

    const status =
      this.statuses().find(
        s =>
          s.id === statusId
      );


    return status
      ? status.name
      : 'Unknown';

  }


  goBack() {

    this.router.navigate([
      '/agent-tickets'
    ]);

  }

}